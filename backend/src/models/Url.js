import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const urlSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isCustomAlias: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    password: {
      type: String,
      select: false,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    lastClickedAt: {
      type: Date,
      default: null,
    },
    qrCode: {
      type: String, // base64 data URL, generated on demand & cached
      default: null,
    },
  },
  { timestamps: true }
);

urlSchema.index({ user: 1, createdAt: -1 });
urlSchema.index({ user: 1, isActive: 1 });
urlSchema.index({ user: 1, totalClicks: -1 });
// Expired links are marked as expired instead of being deleted,
// allowing users to view and reactivate them later.
urlSchema.index({ title: 'text', originalUrl: 'text', tags: 'text' });

urlSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);
  next();
});

urlSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return Promise.resolve(true);
  return bcrypt.compare(candidate, this.password);
};

urlSchema.virtual('isExpired').get(function isExpired() {
  return Boolean(this.expiresAt && this.expiresAt.getTime() < Date.now());
});

urlSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Url', urlSchema);
