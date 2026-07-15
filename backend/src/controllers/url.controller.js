import Url from '../models/Url.js';
import Click from '../models/Click.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateUniqueShortCode, ensureAliasAvailable } from '../services/url.service.js';
import { generateQRCode } from '../services/qrcode.service.js';
import { invalidateUrlCache } from '../services/cache.service.js';
import { recordAudit } from '../services/audit.service.js';
import { env } from '../config/env.js';

export const createUrl = asyncHandler(async (req, res) => {
  const { originalUrl, customAlias, title, tags, password, expiresAt } = req.body;

  let shortCode;
  let isCustomAlias = false;

  if (customAlias) {
    await ensureAliasAvailable(customAlias);
    shortCode = customAlias;
    isCustomAlias = true;
  } else {
    shortCode = await generateUniqueShortCode();
  }

  const url = await Url.create({
    user: req.user.id,
    originalUrl,
    shortCode,
    isCustomAlias,
    title: title || '',
    tags: tags || [],
    password: password || null,
    expiresAt: expiresAt || null,
  });

  const shortUrl = `${env.baseUrl}/${url.shortCode}`;

  await recordAudit({
    actor: req.user.id,
    actorEmail: req.user.email,
    action: 'url.create',
    targetType: 'Url',
    targetId: url._id,
    req,
    metadata: { shortCode: url.shortCode, originalUrl: url.originalUrl },
  });

  sendSuccess(res, 201, 'Short URL created successfully', {
    url: { ...url.toObject(), password: undefined },
    shortUrl,
  });
});

export const getUserUrls = asyncHandler(async (req, res) => {
  const {
    search = '',
    sortBy = 'createdAt',
    order = 'desc',
    status = 'all', // all, active, expired, inactive
    page = 1,
    limit = 10,
  } = req.query;

  const query = { user: req.user.id };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { originalUrl: { $regex: search, $options: 'i' } },
      { shortCode: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const now = new Date();
  if (status === 'active') {
    query.isActive = true;
    query.$and = [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }];
  } else if (status === 'expired') {
    query.expiresAt = { $lte: now };
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  const allowedSort = ['createdAt', 'totalClicks', 'title', 'expiresAt'];
  const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = order === 'asc' ? 1 : -1;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const [urls, total] = await Promise.all([
    Url.find(query)
      .sort({ [sortField]: sortDir })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Url.countDocuments(query),
  ]);

  const urlsWithShortLink = urls.map((u) => ({
    ...u,
    shortUrl: `${env.baseUrl}/${u.shortCode}`,
    hasPassword: Boolean(u.password),
    password: undefined,
  }));

  sendSuccess(res, 200, 'URLs fetched successfully', { urls: urlsWithShortLink }, {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

export const getUrlById = asyncHandler(async (req, res) => {
  const url = await Url.findOne({ _id: req.params.id, user: req.user.id }).lean();
  if (!url) throw new ApiError(404, 'Short URL not found');

  sendSuccess(res, 200, 'URL fetched successfully', {
    url: { ...url, shortUrl: `${env.baseUrl}/${url.shortCode}`, hasPassword: Boolean(url.password), password: undefined },
  });
});

export const updateUrl = asyncHandler(async (req, res) => {
  const url = await Url.findOne({ _id: req.params.id, user: req.user.id });
  if (!url) throw new ApiError(404, 'Short URL not found');

  const { originalUrl, title, tags, password, expiresAt, isActive } = req.body;

  if (originalUrl !== undefined) url.originalUrl = originalUrl;
  if (title !== undefined) url.title = title;
  if (tags !== undefined) url.tags = tags;
  if (password !== undefined) url.password = password || null;
  if (expiresAt !== undefined) url.expiresAt = expiresAt || null;
  if (isActive !== undefined) url.isActive = isActive;

  await url.save();
  await invalidateUrlCache(url.shortCode);

  await recordAudit({
    actor: req.user.id,
    actorEmail: req.user.email,
    action: 'url.update',
    targetType: 'Url',
    targetId: url._id,
    req,
    metadata: { shortCode: url.shortCode },
  });

  sendSuccess(res, 200, 'URL updated successfully', {
    url: { ...url.toObject(), password: undefined },
  });
});

export const deleteUrl = asyncHandler(async (req, res) => {
  const url = await Url.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!url) throw new ApiError(404, 'Short URL not found');

  await Promise.all([invalidateUrlCache(url.shortCode), Click.deleteMany({ url: url._id })]);

  await recordAudit({
    actor: req.user.id,
    actorEmail: req.user.email,
    action: 'url.delete',
    targetType: 'Url',
    targetId: url._id,
    req,
    metadata: { shortCode: url.shortCode },
  });

  sendSuccess(res, 200, 'URL deleted successfully');
});

export const getQrCode = asyncHandler(async (req, res) => {
  const url = await Url.findOne({ _id: req.params.id, user: req.user.id });
  if (!url) throw new ApiError(404, 'Short URL not found');

  const shortUrl = `${env.baseUrl}/${url.shortCode}`;

  if (!url.qrCode) {
    url.qrCode = await generateQRCode(shortUrl);
    await url.save();
  }

  sendSuccess(res, 200, 'QR code generated', { qrCode: url.qrCode, shortUrl });
});
