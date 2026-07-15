import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'shortify API',
      version: '1.0.0',
      description:
        'REST API for the shortify URL shortening platform. Supports JWT session auth (Bearer token) ' +
        'and API key auth (X-API-Key header) for programmatic access.',
      contact: { name: 'shortify' },
    },
    servers: [{ url: env.baseUrl, description: env.nodeEnv === 'production' ? 'Production' : 'Local' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
        Url: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            originalUrl: { type: 'string' },
            shortCode: { type: 'string' },
            shortUrl: { type: 'string' },
            title: { type: 'string' },
            totalClicks: { type: 'number' },
            isActive: { type: 'boolean' },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
