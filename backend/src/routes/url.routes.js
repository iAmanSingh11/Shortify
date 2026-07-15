import { Router } from 'express';
import {
  createUrl,
  getUserUrls,
  getUrlById,
  updateUrl,
  deleteUrl,
  getQrCode,
} from '../controllers/url.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUrlSchema, updateUrlSchema } from '../validators/url.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authenticateFlexible, requireScope } from '../middlewares/apiKey.middleware.js';
import { createUrlLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();
// Supports both JWT and API key authentication.
router.use(authenticateFlexible(authenticate));

/**
 * @openapi
 * /api/urls:
 *   post:
 *     summary: Create a short URL
 *     tags: [URLs]
 *     security: [{ bearerAuth: [] }, { apiKeyAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [originalUrl]
 *             properties:
 *               originalUrl: { type: string, example: 'https://example.com/a/very/long/path' }
 *               customAlias: { type: string, example: my-brand }
 *               title: { type: string }
 *               password: { type: string }
 *               expiresAt: { type: string, format: date-time }
 *               tags: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Short URL created }
 *       409: { description: Alias already taken }
 *   get:
 *     summary: List the authenticated user's short URLs (search, sort, filter, paginate)
 *     tags: [URLs]
 *     security: [{ bearerAuth: [] }, { apiKeyAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, active, inactive, expired] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, totalClicks, title, expiresAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: URLs fetched }
 */
router.post('/', createUrlLimiter, requireScope('urls:write'), validate(createUrlSchema), createUrl);
router.get('/', requireScope('urls:read'), getUserUrls);

/**
 * @openapi
 * /api/urls/{id}:
 *   get:
 *     summary: Get a single short URL by ID
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: URL fetched }
 *       404: { description: Not found }
 *   patch:
 *     summary: Update a short URL
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: URL updated }
 *   delete:
 *     summary: Delete a short URL
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: URL deleted }
 */
router.get('/:id', requireScope('urls:read'), getUrlById);
router.patch('/:id', requireScope('urls:write'), validate(updateUrlSchema), updateUrl);
router.delete('/:id', requireScope('urls:write'), deleteUrl);

/**
 * @openapi
 * /api/urls/{id}/qrcode:
 *   get:
 *     summary: Generate (or fetch cached) QR code for a short URL
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: QR code as a base64 data URL }
 */
router.get('/:id/qrcode', requireScope('urls:read'), getQrCode);

export default router;
