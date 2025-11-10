import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "user" | "tester" | "admin";
export type AuthProvider = "credentials" | "google" | "github";

export interface IUserSettings {
  notifications: {
    email: boolean;
    desktop: boolean;
    weeklyReport: boolean;
  };
  scanning: {
    autoScan: boolean;
    clipboardMonitoring: boolean;
    confidenceThreshold: number;
  };
  appearance: {
    darkMode: boolean;
    soundEffects: boolean;
  };
  privacy: {
    shareAnonymousData: boolean;
    improveModel: boolean;
  };
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  provider: AuthProvider;
  providerId?: string;
  settings: IUserSettings;
  scanQuota: {
    hourly: number;
    daily: number;
    monthly: number;
    lastReset: Date;
  };
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    passwordHash: {
      type: String,
      required: function (this: IUser) {
        return this.provider === "credentials";
      },
    },
    role: {
      type: String,
      enum: ["user", "tester", "admin"],
      default: "user",
    },
    provider: {
      type: String,
      enum: ["credentials", "google", "github"],
      default: "credentials",
    },
    providerId: {
      type: String,
      sparse: true,
    },
    settings: {
      notifications: {
        email: { type: Boolean, default: true },
        desktop: { type: Boolean, default: true },
        weeklyReport: { type: Boolean, default: true },
      },
      scanning: {
        autoScan: { type: Boolean, default: false },
        clipboardMonitoring: { type: Boolean, default: false },
        confidenceThreshold: { type: Number, default: 0.7, min: 0, max: 1 },
      },
      appearance: {
        darkMode: { type: Boolean, default: false },
        soundEffects: { type: Boolean, default: true },
      },
      privacy: {
        shareAnonymousData: { type: Boolean, default: true },
        improveModel: { type: Boolean, default: true },
      },
    },
    scanQuota: {
      hourly: { type: Number, default: 0 },
      daily: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
      lastReset: { type: Date, default: Date.now },
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// indexes for lookups
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ provider: 1, providerId: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
