import { createRedisConnection } from '../config/redis.js';

// Dedicated Redis connection for BullMQ (must not share the general cache client)
export const bullConnection = createRedisConnection({ forBullMQ: true });

export const QUEUE_NAMES = {
  ANALYTICS: 'analytics-processing',
};

export const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { count: 1000, age: 3600 },
  removeOnFail: { count: 5000 },
};
