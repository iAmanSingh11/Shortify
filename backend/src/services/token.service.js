import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';

export const generateAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });

// SHA-256 hash of a raw token used so the DB never stores usable refresh tokens.
export const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

// Generates a refresh token with a unique tokenId, so a single stored token record can be looked up and revoked independently of its value.
export const generateRefreshToken = (user) => {
  const tokenId = uuidv4();
  const token = jwt.sign({ sub: user._id.toString(), jti: tokenId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
  return { token, tokenId };
};

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);

// Converts a JWT expiresIn style duration ("7d", "15m") into a future Date.
export const durationToDate = (durationStr) => {
  const match = /^(\d+)([smhd])$/.exec(durationStr);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [, amount, unit] = match;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + Number(amount) * multipliers[unit]);
};

// API keys: format is `<prefix><random 32 hex chars>`,
export const generateApiKey = () => {
  const raw = `${env.apiKeyPrefix}${crypto.randomBytes(24).toString('hex')}`;
  return { raw, hash: hashToken(raw), prefix: raw.slice(0, 14) };
};
