import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';

// Skipping Redis in test mode and use the default in memory store.
const buildStore = (prefix) => {
  if (env.nodeEnv === 'test') return undefined;
  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: `rl:${prefix}:`,
  });
};

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('api'),
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter limiter for auth endpoints to slow down brute force / credential stuffing
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('auth'),
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
});

// Redirect endpoint is high traffic but should still be protected from scraping
export const redirectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('redirect'),
  keyGenerator: (req) => req.ip,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

// Link creation limiter to prevent spam link generation
export const createUrlLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('create-url'),
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: 'Hourly link creation limit reached.' },
});
