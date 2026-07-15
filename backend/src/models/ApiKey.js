import mongoose from 'mongoose';
// Stores API keys securely by saving only their SHA-256 hash.
// The original key is displayed only once when it is created.
const apiKeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    keyPrefix: {
      type: String, // first 12 chars shown in the UI for identification
      required: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    scopes: {
      type: [String],
      enum: ['urls:read', 'urls:write', 'analytics:read'],
      default: ['urls:read', 'urls:write'],
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

apiKeySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('ApiKey', apiKeySchema);
