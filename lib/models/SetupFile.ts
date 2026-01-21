import mongoose from 'mongoose';

const setupFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    default: '1.0.0',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Ensure only one active setup file at a time
setupFileSchema.pre('save', async function(next) {
  if (this.isActive) {
    await mongoose.model('SetupFile').updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

const SetupFile = mongoose.models.SetupFile || mongoose.model('SetupFile', setupFileSchema);

export default SetupFile;
