import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenId: { type: String, required: true }, // uuid (jti), used to find+revoke without needing the raw token
    tokenHash: { type: String, required: true }, // sha256 hash of the actual refresh token (raw token never stored)
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Account lockout
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, createdAt: -1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

// Account lockout helpers
userSchema.virtual('isLocked').get(function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

userSchema.methods.registerFailedLogin = async function registerFailedLogin() {
  // If a previous lock has already expired, reset the counter first
  if (this.lockUntil && this.lockUntil.getTime() < Date.now()) {
    this.loginAttempts = 0;
    this.lockUntil = null;
  }

  this.loginAttempts += 1;

  if (this.loginAttempts >= env.lockout.maxAttempts) {
    this.lockUntil = new Date(Date.now() + env.lockout.durationMinutes * 60 * 1000);
  }

  await this.save({ validateBeforeSave: false });
  return this.isLocked;
};

userSchema.methods.registerSuccessfulLogin = async function registerSuccessfulLogin() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  this.lastLoginAt = new Date();
  await this.save({ validateBeforeSave: false });
};

export default mongoose.model('User', userSchema);
