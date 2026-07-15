import mongoose from 'mongoose';

// Stores a complete audit log of important system and security events.
const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorEmail: { type: String, default: '' }, // denormalized for fast display even if user is later deleted
    action: {
      type: String,
      required: true,
      enum: [
        'auth.register',
        'auth.login.success',
        'auth.login.failed',
        'auth.login.locked',
        'auth.logout',
        'auth.refresh',
        'url.create',
        'url.update',
        'url.delete',
        'apikey.create',
        'apikey.revoke',
        'admin.user.role_change',
        'admin.user.deactivate',
        'admin.user.activate',
        'admin.user.delete',
        'admin.url.delete',
      ],
      index: true,
    },
    targetType: { type: String, default: '' }, // e.g. 'User', 'Url', 'ApiKey'
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    requestId: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
