import { redisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';

const URL_CACHE_PREFIX = 'url:';
const URL_CACHE_TTL = 60 * 60 * 6; // 6 hours (frequently accessed links stay hot)

export const cacheUrl = async (shortCode, urlDoc) => {
  try {
    await redisClient.set(`${URL_CACHE_PREFIX}${shortCode}`, JSON.stringify(urlDoc), 'EX', URL_CACHE_TTL);
  } catch (err) {
    logger.error({ err }, 'Failed to cache URL');
  }
};

export const getCachedUrl = async (shortCode) => {
  try {
    const cached = await redisClient.get(`${URL_CACHE_PREFIX}${shortCode}`);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    logger.error({ err }, 'Failed to read URL cache');
    return null;
  }
};

export const invalidateUrlCache = async (shortCode) => {
  try {
    await redisClient.del(`${URL_CACHE_PREFIX}${shortCode}`);
  } catch (err) {
    logger.error({ err }, 'Failed to invalidate URL cache');
  }
};

// Uses Redis to batch click updates before saving them to the database.
export const incrementClickCounter = async (shortCode) => {
  try {
    await redisClient.incr(`clicks:${shortCode}`);
  } catch (err) {
    logger.error({ err }, 'Failed to increment click counter');
  }
};
