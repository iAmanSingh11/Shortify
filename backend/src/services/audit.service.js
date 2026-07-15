import AuditLog from '../models/AuditLog.js';
import { logger } from '../config/logger.js';

// Records audit logs without impacting the request flow.
export const recordAudit = async ({
  actor = null,
  actorEmail = '',
  action,
  targetType = '',
  targetId = null,
  req = null,
  metadata = {},
  status = 'success',
}) => {
  try {
    await AuditLog.create({
      actor,
      actorEmail,
      action,
      targetType,
      targetId,
      ip: req?.ip || '',
      userAgent: req?.headers?.['user-agent'] || '',
      requestId: req?.id || '',
      metadata,
      status,
    });
  } catch (err) {
    logger.error({ err, action }, 'Failed to write audit log entry');
  }
};
