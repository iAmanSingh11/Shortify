import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema(
  {
    url: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
      index: true,
    },
    shortCode: {
      type: String,
      required: true,
      index: true,
    },
    ip: { type: String, default: '' },
    country: { type: String, default: 'Unknown' },
    countryCode: { type: String, default: '' },
    city: { type: String, default: 'Unknown' },
    browser: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    device: { type: String, default: 'Desktop' },
    referrer: { type: String, default: 'Direct' },
    userAgent: { type: String, default: '' },
    // SHA-256 hash of (ip + userAgent) — lets us detect returning visitors
    // without storing raw IPs longer than necessary or across documents.
    visitorHash: { type: String, default: '', index: true },
    isReturningVisitor: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

clickSchema.index({ url: 1, createdAt: -1 });
clickSchema.index({ url: 1, visitorHash: 1 });
clickSchema.index({ shortCode: 1, createdAt: -1 });

export default mongoose.model('Click', clickSchema);
