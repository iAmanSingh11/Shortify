import { Queue } from 'bullmq';
import { bullConnection, QUEUE_NAMES, defaultJobOptions } from './queue.config.js';
import { env } from '../config/env.js';

export const analyticsQueue = new Queue(QUEUE_NAMES.ANALYTICS, {
  connection: bullConnection,
  defaultJobOptions,
});

// Processes analytics without slowing down the redirect response.
export const enqueueClickEvent = async (payload) => {
// Skips background job processing during tests.

  if (env.nodeEnv === 'test') return;
  await analyticsQueue.add('process-click', payload, {
    priority: 1,
  });
};
