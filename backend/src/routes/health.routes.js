import { Router } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis.js';
import { analyticsQueue } from '../queues/analytics.queue.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Basic liveness check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is up
 */
router.get('/', (req, res) => sendSuccess(res, 200, 'OK', { uptime: process.uptime() }));

// Liveness, used by orchestrators to decide whether to restart the container
router.get('/live', (req, res) => sendSuccess(res, 200, 'Alive', { uptime: process.uptime() }));

// Readiness, used to decide whether to route traffic here
router.get(
  '/ready',
  asyncHandler(async (req, res) => {
    const mongoState = mongoose.connection.readyState; // 1 = connected
    let redisOk = false;
    try {
      const pong = await redisClient.ping();
      redisOk = pong === 'PONG';
    } catch {
      redisOk = false;
    }

    const ready = mongoState === 1 && redisOk;
    sendSuccess(res, ready ? 200 : 503, ready ? 'Ready' : 'Not ready', {
      mongo: mongoState === 1 ? 'connected' : 'disconnected',
      redis: redisOk ? 'connected' : 'disconnected',
    });
  })
);

//(no paid APM required)
router.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    const mem = process.memoryUsage();
    const jobCounts = await analyticsQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');

    sendSuccess(res, 200, 'Metrics fetched', {
      uptimeSeconds: process.uptime(),
      memory: {
        rssMB: Math.round(mem.rss / 1024 / 1024),
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      },
      mongoState: mongoose.connection.readyState,
      analyticsQueue: jobCounts,
    });
  })
);

export default router;
