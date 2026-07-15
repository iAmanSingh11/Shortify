import ApiKey from '../models/ApiKey.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateApiKey } from '../services/token.service.js';
import { recordAudit } from '../services/audit.service.js';
import { sendNewApiKeyEmail } from '../services/email.service.js';

export const createApiKey = asyncHandler(async (req, res) => {
  const { name, scopes, expiresInDays } = req.body;
  const { raw, hash, prefix } = generateApiKey();

  const apiKey = await ApiKey.create({
    user: req.user.id,
    name,
    keyPrefix: prefix,
    keyHash: hash,
    scopes: scopes && scopes.length ? scopes : ['urls:read', 'urls:write'],
    expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null,
  });

  await recordAudit({
    actor: req.user.id,
    actorEmail: req.user.email,
    action: 'apikey.create',
    targetType: 'ApiKey',
    targetId: apiKey._id,
    req,
    metadata: { name },
  });
  sendNewApiKeyEmail(req.user.email, req.user.name, name).catch(() => {});

  // The raw key is only ever returned here, cannot be retrieved again.
  sendSuccess(res, 201, 'API key created. Copy it now — it will not be shown again.', {
    apiKey: {
      id: apiKey._id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    },
    rawKey: raw,
  });
});

export const listApiKeys = asyncHandler(async (req, res) => {
  const keys = await ApiKey.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
  sendSuccess(res, 200, 'API keys fetched', { apiKeys: keys });
});

export const revokeApiKey = asyncHandler(async (req, res) => {
  const key = await ApiKey.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { isActive: false },
    { new: true }
  );
  if (!key) throw new ApiError(404, 'API key not found');

  await recordAudit({
    actor: req.user.id,
    actorEmail: req.user.email,
    action: 'apikey.revoke',
    targetType: 'ApiKey',
    targetId: key._id,
    req,
  });

  sendSuccess(res, 200, 'API key revoked');
});
