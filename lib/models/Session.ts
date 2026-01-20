import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
  userId: string;
  desktopKeyId?: string;
  deviceInfo: {
    platform: string;
    appVersion: string;
    osVersion: string;
    hostname: string;
    electronVersion?: string;
  };
  ipAddress?: string;
  lastSeen: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    desktopKeyId: {
      type: String,
      index: true,
    },
    deviceInfo: {
      platform: {
        type: String,
        required: true,
        enum: ["win32", "darwin", "linux", "unknown"],
      },
      appVersion: {
        type: String,
        required: true,
      },
      osVersion: {
        type: String,
        required: true,
      },
      hostname: {
        type: String,
        required: true,
      },
      electronVersion: {
        type: String,
      },
    },
    ipAddress: {
      type: String,
      maxlength: [45, "IP address cannot exceed 45 characters"],
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for finding user sessions
SessionSchema.index({ userId: 1, isActive: 1 });
SessionSchema.index({ lastSeen: 1, isActive: 1 });

// Auto-deactivate sessions inactive for more than 5 minutes
SessionSchema.index({ lastSeen: 1 }, { 
  expireAfterSeconds: 300,
  partialFilterExpression: { isActive: true }
});

const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default Session;
