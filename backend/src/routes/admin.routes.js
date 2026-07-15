import { Router } from 'express';
import {
  getAdminOverview,
  listUsers,
  updateUserRole,
  setUserActiveStatus,
  deleteUser,
  listAllLinks,
  deleteAnyLink,
  listAuditLogs,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateUserRoleSchema, updateUserStatusSchema } from '../validators/admin.validator.js';

const router = Router();

// Every route below requires a valid session AND the 'admin' role.
router.use(authenticate, authorize('admin'));

/**
 * @openapi
 * /api/admin/overview:
 *   get:
 *     summary: Platform-wide stats for the admin dashboard (admin only)
 *     tags: [Admin]
 *     responses:
 *       200: { description: Overview fetched }
 *       403: { description: Forbidden — admin role required }
 */
router.get('/overview', getAdminOverview);

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: List/search all users (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, admin, all] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, all] }
 *     responses:
 *       200: { description: Users fetched }
 */
router.get('/users', listUsers);

/**
 * @openapi
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Change a user's role (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Role updated }
 */
router.patch('/users/:id/role', validate(updateUserRoleSchema), updateUserRole);

/**
 * @openapi
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a user account (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/users/:id/status', validate(updateUserStatusSchema), setUserActiveStatus);

/**
 * @openapi
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user and all of their links (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User deleted }
 */
router.delete('/users/:id', deleteUser);

/**
 * @openapi
 * /api/admin/links:
 *   get:
 *     summary: List every short link across all users (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Links fetched }
 */
router.get('/links', listAllLinks);

/**
 * @openapi
 * /api/admin/links/{id}:
 *   delete:
 *     summary: Delete any link, regardless of owner (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Link deleted }
 */
router.delete('/links/:id', deleteAnyLink);

/**
 * @openapi
 * /api/admin/audit-logs:
 *   get:
 *     summary: Browse the full audit trail (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [success, failure] }
 *       - in: query
 *         name: actorEmail
 *         schema: { type: string }
 *     responses:
 *       200: { description: Audit logs fetched }
 */
router.get('/audit-logs', listAuditLogs);

export default router;
