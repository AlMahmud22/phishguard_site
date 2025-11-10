import mongoose, { Schema, Document, Model } from "mongoose";

export type ScanStatus = "safe" | "warning" | "danger";
export type ScanContext = "clipboard" | "manual" | "browser";

export interface IScan extends Document {
  userId: mongoose.Types.ObjectId;
  scanId: string;
  url: string;
  status: ScanStatus;
  score: number;
  confidence: number;
  verdict: {
    isSafe: boolean;
    isPhishing: boolean;
    isMalware: boolean;
    isSpam: boolean;
    category: string;
  };
  analysis: {
    domain: {
      name: string;
      age?: number;
      registrar?: string;
      country?: string;
      reputation: string;
    };
    security: {
      hasHttps: boolean;
      hasSsl: boolean;
      certificate?: any;
    };
    content?: {
      title?: string;
      hasLoginForm?: boolean;
      externalLinks?: number;
      suspiciousScripts?: boolean;
    };
    ml: {
      localScore?: number;
      cloudScore: number;
      combinedScore: number;
      model: string;
    };
    threat: {
      databases: string[];
      lastReported?: Date;
      reportCount: number;
    };
  };
  factors: string[];
  recommendation: string;
  localScore?: number;
  localFactors?: string[];
  context?: ScanContext;
  synced: boolean;
  timestamp: Date;
  processingTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScanSchema = new Schema<IScan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scanId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["safe", "warning", "danger"],
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    verdict: {
      isSafe: { type: Boolean, required: true },
      isPhishing: { type: Boolean, required: true },
      isMalware: { type: Boolean, required: true },
      isSpam: { type: Boolean, required: true },
      category: { type: String, required: true },
    },
    analysis: {
      domain: {
        name: { type: String, required: true },
        age: { type: Number },
        registrar: { type: String },
        country: { type: String },
        reputation: { type: String, required: true },
      },
      security: {
        hasHttps: { type: Boolean, required: true },
        hasSsl: { type: Boolean, required: true },
        certificate: { type: Schema.Types.Mixed },
      },
      content: {
        title: { type: String },
        hasLoginForm: { type: Boolean },
        externalLinks: { type: Number },
        suspiciousScripts: { type: Boolean },
      },
      ml: {
        localScore: { type: Number },
        cloudScore: { type: Number, required: true },
        combinedScore: { type: Number, required: true },
        model: { type: String, required: true },
      },
      threat: {
        databases: [{ type: String }],
        lastReported: { type: Date },
        reportCount: { type: Number, required: true },
      },
    },
    factors: [{ type: String }],
    recommendation: {
      type: String,
      required: true,
    },
    localScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    localFactors: [{ type: String }],
    context: {
      type: String,
      enum: ["clipboard", "manual", "browser"],
    },
    synced: {
      type: Boolean,
      default: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    processingTime: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
ScanSchema.index({ userId: 1, timestamp: -1 });
ScanSchema.index({ url: 1, userId: 1 });
ScanSchema.index({ status: 1, userId: 1 });

const Scan: Model<IScan> =
  mongoose.models.Scan || mongoose.model<IScan>("Scan", ScanSchema);

export default Scan;
