import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppDownload extends Document {
  filename: string;
  originalFilename: string;
  filepath: string;
  filesize: number;
  mimetype: string;
  version: string;
  releaseNotes?: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  downloadCount: number;
  active: boolean;
  previousFilepath?: string; // Keep reference to previous file for cleanup
}

const AppDownloadSchema = new Schema<IAppDownload>(
  {
    filename: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    filepath: {
      type: String,
      required: true,
      unique: true,
    },
    filesize: {
      type: Number,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: true,
    },
    releaseNotes: {
      type: String,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    previousFilepath: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookup of active downloads
AppDownloadSchema.index({ active: 1, uploadedAt: -1 });

const AppDownload: Model<IAppDownload> =
  mongoose.models.AppDownload ||
  mongoose.model<IAppDownload>("AppDownload", AppDownloadSchema);

export default AppDownload;
