import mongoose, { Schema, Document, Model } from "mongoose";

export type LogLevel = "info" | "warning" | "error" | "critical";

export interface ILog extends Document {
  timestamp: Date;
  level: LogLevel;
  action: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const LogSchema = new Schema<ILog>(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    level: {
      type: String,
      enum: ["info", "warning", "error", "critical"],
      default: "info",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
      maxlength: [200, "Action cannot exceed 200 characters"],
      index: true,
    },
    userId: {
      type: String,
      sparse: true,
      index: true,
    },
    userName: {
      type: String,
      trim: true,
      maxlength: [100, "User name cannot exceed 100 characters"],
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: [45, "IP address cannot exceed 45 characters"],
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: [500, "User agent cannot exceed 500 characters"],
    },
    details: {
      type: String,
      required: [true, "Details are required"],
      maxlength: [2000, "Details cannot exceed 2000 characters"],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// indexes for fast queries
LogSchema.index({ timestamp: -1, level: 1 });
LogSchema.index({ userId: 1, timestamp: -1 });
LogSchema.index({ action: 1, timestamp: -1 });

// auto delete logs older than 90 days
LogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

const Log: Model<ILog> =
  mongoose.models.Log || mongoose.model<ILog>("Log", LogSchema);

export default Log;
