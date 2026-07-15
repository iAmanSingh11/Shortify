import Url from '../models/Url.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getCachedUrl, cacheUrl, invalidateUrlCache } from '../services/cache.service.js';
import { enqueueClickEvent } from '../queues/analytics.queue.js';
import { env } from '../config/env.js';

const getClientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';

// Fetches the URL doc, preferring Redis cache to avoid a DB round trip on every redirect.
const resolveUrlDoc = async (shortCode) => {
  const cached = await getCachedUrl(shortCode);
  if (cached) return { doc: cached, fromCache: true };

  const doc = await Url.findOne({ shortCode }).select('+password').lean();
  if (doc) await cacheUrl(shortCode, doc);
  return { doc, fromCache: false };
};

const assertRedirectable = (doc) => {
  if (!doc) throw new ApiError(404, 'This short link does not exist');
  if (!doc.isActive) throw new ApiError(410, 'This short link has been deactivated');
  if (doc.expiresAt && new Date(doc.expiresAt).getTime() < Date.now()) {
    throw new ApiError(410, 'This short link has expired');
  }
};

const trackClick = (req, doc) => {
  enqueueClickEvent({
    shortCode: doc.shortCode,
    urlId: doc._id,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] || '',
    referrer: req.headers.referer || req.headers.referrer || '',
  }).catch(() => {}); // tracking failures must never break the redirect
};

// GET /:shortCode
// If the link is pswd protected, we don't redirect directly, instead we
// tell the frontend so it can render a password prompt, which then calls
// POST /api/redirect/:shortCode/verify to retrieve the destination.
export const handleRedirect = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;
  const { doc } = await resolveUrlDoc(shortCode);

  assertRedirectable(doc);

  if (doc.password) {
    return res.redirect(302, `${env.clientUrl}/protected/${shortCode}`);
  }

  trackClick(req, doc);
  return res.redirect(302, doc.originalUrl);
});

// POST /api/redirect/:shortCode/verify  {pswd}
export const verifyAndRedirect = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;
  const { password } = req.body;

  const doc = await Url.findOne({ shortCode }).select('+password');
  assertRedirectable(doc);

  if (!doc.password) {
    return sendSuccess(res, 200, 'No password required', { originalUrl: doc.originalUrl });
  }

  const isMatch = await doc.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Incorrect password');

  trackClick(req, doc);
  sendSuccess(res, 200, 'Password verified', { originalUrl: doc.originalUrl });
});

// Used internally after an update to keep cache correct
export const refreshCacheForShortCode = async (shortCode) => {
  await invalidateUrlCache(shortCode);
};
