import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { swaggerSpec } from './config/swagger.js';
import { requestId } from './middlewares/requestId.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { sendSuccess } from './utils/apiResponse.js';

import authRoutes from './routes/auth.routes.js';
import urlRoutes from './routes/url.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import adminRoutes from './routes/admin.routes.js';
import apiKeyRoutes from './routes/apiKey.routes.js';
import healthRoutes from './routes/health.routes.js';
import { redirectApiRouter, redirectRootRouter } from './routes/redirect.routes.js';

const app = express();

// Trust the first proxy hop (Render/Vercel) 
app.set('trust proxy', 1);

app.use(requestId);
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    autoLogging: { ignore: (req) => req.url.startsWith('/health') },
  })
);

// Liveness / readiness / metrics
app.use('/health', healthRoutes);

// API documentation
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'shortify API Docs' }));

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/redirect', redirectApiRouter);

// Root-level short link redirect route must be registered After all /api
// routes so it doesn't shadow them (e.g. GET /health, GET /api/...).
app.use('/', redirectRootRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
