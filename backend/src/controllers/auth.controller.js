import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  durationToDate,
} from '../services/token.service.js';
import { recordAudit } from '../services/audit.service.js';
import { sendWelcomeEmail, sendAccountLockedEmail } from '../services/email.service.js';
import { env } from '../config/env.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production', // HTTPS only in production
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  path: '/api/auth', //cookie to auth endpoints only
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Issues a fresh access + refresh token pair, persisting only a HASH of the
// refresh token alongside device metadata so it can be audited and individually revoked.
const issueTokens = async (user, req, res) => {
  const accessToken = generateAccessToken(user);
  const { token: refreshToken, tokenId } = generateRefreshToken(user);

  user.refreshTokens = (user.refreshTokens || []).slice(-9); // cap stored sessions per user
  user.refreshTokens.push({
    tokenId,
    tokenHash: hashToken(refreshToken),
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
    expiresAt: durationToDate(env.jwt.refreshExpiresIn),
  });
  await user.save({ validateBeforeSave: false });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
  return accessToken;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  //Bootstrap Email for admin, everyone else registers as a regular user.
  const role = email.toLowerCase() === env.bootstrapAdminEmail ? 'admin' : 'user';

  const user = await User.create({ name, email, password, role });
  const accessToken = await issueTokens(user, req, res);

  await recordAudit({ actor: user._id, actorEmail: user.email, action: 'auth.register', targetType: 'User', targetId: user._id, req });
  sendWelcomeEmail(user.email, user.name).catch(() => {});

  sendSuccess(res, 201, 'Account created successfully', {
    user: user.toSafeObject(),
    accessToken,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens +loginAttempts +lockUntil');

  if (!user) {
    await recordAudit({ actorEmail: email, action: 'auth.login.failed', req, status: 'failure', metadata: { reason: 'no_such_account' } });
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.isLocked) {
    await recordAudit({ actor: user._id, actorEmail: email, action: 'auth.login.locked', req, status: 'failure' });
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw new ApiError(423, `Account temporarily locked due to repeated failed logins. Try again in ${minutesLeft} minute(s).`);
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    const nowLocked = await user.registerFailedLogin();
    await recordAudit({
      actor: user._id,
      actorEmail: email,
      action: nowLocked ? 'auth.login.locked' : 'auth.login.failed',
      req,
      status: 'failure',
      metadata: { attempts: user.loginAttempts },
    });
    if (nowLocked) {
      sendAccountLockedEmail(user.email, user.name, env.lockout.durationMinutes).catch(() => {});
      throw new ApiError(423, `Too many failed attempts. Account locked for ${env.lockout.durationMinutes} minutes.`);
    }
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');

  await user.registerSuccessfulLogin();
  const accessToken = await issueTokens(user, req, res);

  await recordAudit({ actor: user._id, actorEmail: user.email, action: 'auth.login.success', req });

  sendSuccess(res, 200, 'Logged in successfully', {
    user: user.toSafeObject(),
    accessToken,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw new ApiError(401, 'Refresh token missing');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user) throw new ApiError(401, 'Refresh token is no longer valid');

  const tokenHash = hashToken(token);
  const storedIndex = user.refreshTokens.findIndex((t) => t.tokenId === payload.jti && t.tokenHash === tokenHash);

  if (storedIndex === -1) {
    // Possible token theft, the presented token doesn't match any
    // stored hash for its claimed jti. Revoke ALL sessions as a precaution.
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    await recordAudit({ actor: user._id, actorEmail: user.email, action: 'auth.refresh', req, status: 'failure', metadata: { reason: 'token_reuse_detected' } });
    throw new ApiError(401, 'Refresh token is no longer valid. Please log in again.');
  }

  // Rotate: remove the used token, issue new pair
  user.refreshTokens.splice(storedIndex, 1);
  const accessToken = await issueTokens(user, req, res);

  await recordAudit({ actor: user._id, actorEmail: user.email, action: 'auth.refresh', req });

  sendSuccess(res, 200, 'Token refreshed', { accessToken, user: user.toSafeObject() });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.updateOne({ _id: payload.sub }, { $pull: { refreshTokens: { tokenId: payload.jti } } });
      await recordAudit({ actor: payload.sub, action: 'auth.logout', req });
    } catch {
      // token already invalid
    }
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  sendSuccess(res, 200, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');
  sendSuccess(res, 200, 'Current user fetched', { user: user.toSafeObject() });
});
