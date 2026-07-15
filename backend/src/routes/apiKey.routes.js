import { Router } from 'express';
import { createApiKey, listApiKeys, revokeApiKey } from '../controllers/apiKey.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createApiKeySchema } from '../validators/apiKey.validator.js';

const router = Router();

router.use(authenticate); // API keys can only be managed via a logged-in session, never via another API key

/**
 * @openapi
 * /api/api-keys:
 *   post:
 *     summary: Create a new developer API key (raw key is shown only once)
 *     tags: [API Keys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: 'CI deploy script' }
 *               scopes: { type: array, items: { type: string, enum: [urls:read, urls:write, analytics:read] } }
 *               expiresInDays: { type: integer, example: 90 }
 *     responses:
 *       201: { description: API key created }
 *   get:
 *     summary: List your API keys (hashes/prefixes only, never the raw key)
 *     tags: [API Keys]
 *     responses:
 *       200: { description: API keys fetched }
 */
router.post('/', validate(createApiKeySchema), createApiKey);
router.get('/', listApiKeys);

/**
 * @openapi
 * /api/api-keys/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [API Keys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: API key revoked }
 */
router.delete('/:id', revokeApiKey);

export default router;
