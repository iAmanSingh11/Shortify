import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;

  if (!token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.accessSecret);
  } catch (err) {
    throw new ApiError(401, err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token');
  }

  const user = await User.findById(payload.sub).select('_id name email role isActive');
  if (!user || !user.isActive) throw new ApiError(401, 'User no longer exists or is deactivated');

  req.user = { id: user._id.toString(), email: user.email, role: user.role, name: user.name };
  next();
});

// Role-based access control. Usage: router.use(authenticate, authorize('admin'))
export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};

// Optional auth: attaches req.user if a valid token is present, otherwise continues
export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    const user = await User.findById(payload.sub).select('_id name email role isActive');
    if (user && user.isActive) {
      req.user = { id: user._id.toString(), email: user.email, role: user.role, name: user.name };
    }
  } catch {
    // ignore invalid tokens for optional auth
  }
  next();
});
