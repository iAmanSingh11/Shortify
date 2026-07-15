import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

export const createRedisConnection = ({ forBullMQ = false } = {}) => {
  const client = new Redis(env.redisUrl, {
    maxRetriesPerRequest: forBullMQ ? null : 3,

    enableReadyCheck: false,

    lazyConnect: true,

    tls: env.redisUrl.startsWith("rediss://") ? {} : undefined,

    retryStrategy(times) {
      return Math.min(times * 1000, 5000);
    },
  });

  client.on("connect", () => {
    logger.info(`Redis connected${forBullMQ ? " (BullMQ)" : ""}`);
  });

  client.on("error", (err) => {
    logger.error({ err }, "Redis connection error");
  });

  return client;
};

// General purpose cache client used across the app (caching, rate limiting)
export const redisClient = createRedisConnection();



