import mongoose, { Schema, Document } from 'mongoose';

export interface IOneTimeCode extends Document {
  code: string;
  userId: string;
  email: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  consumed: boolean;
}

const OneTimeCodeSchema = new Schema<IOneTimeCode>({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  consumed: {
    type: Boolean,
    default: false,
  },
});

// Auto-delete expired codes
OneTimeCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OneTimeCode = mongoose.models.OneTimeCode || mongoose.model<IOneTimeCode>('OneTimeCode', OneTimeCodeSchema);

export default OneTimeCode;
