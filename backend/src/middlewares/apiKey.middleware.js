import ApiKey from '../models/ApiKey.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashToken } from '../services/token.service.js';

// Middleware for API Key authentication using the `X-API-Key` header.
export const authenticateApiKey = asyncHandler(async (req, res, next) => {
  const rawKey = req.headers['x-api-key'];
  if (!rawKey) throw new ApiError(401, 'API key required (X-API-Key header)');

  const keyHash = hashToken(rawKey);
  const apiKey = await ApiKey.findOne({ keyHash, isActive: true }).select('+keyHash');

  if (!apiKey) throw new ApiError(401, 'Invalid API key');
  if (apiKey.expiresAt && apiKey.expiresAt.getTime() < Date.now()) {
    throw new ApiError(401, 'This API key has expired');
  }

  const user = await User.findById(apiKey.user).select('_id name email role isActive');
  if (!user || !user.isActive) throw new ApiError(401, 'The owning account is no longer active');

  apiKey.lastUsedAt = new Date();
  await apiKey.save();

  req.user = { id: user._id.toString(), email: user.email, role: user.role, name: user.name };
  req.apiKeyScopes = apiKey.scopes;
  req.authMethod = 'apiKey';
  next();
});

// Combined middleware: accepts either a JWT or an API key.
export const authenticateFlexible = (jwtAuthenticate) =>
  asyncHandler(async (req, res, next) => {
    if (req.headers['x-api-key']) return authenticateApiKey(req, res, next);
    return jwtAuthenticate(req, res, next);
  });

export const requireScope = (scope) => (req, res, next) => {
  if (req.authMethod !== 'apiKey') return next(); // JWT sessions have full access
  if (!req.apiKeyScopes?.includes(scope)) {
    return next(new ApiError(403, `This API key does not have the required "${scope}" scope`));
  }
  next();
};
