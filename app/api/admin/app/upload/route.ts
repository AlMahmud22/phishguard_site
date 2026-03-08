export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import AppDownload from "@/lib/models/AppDownload";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { validateFileUpload, validatePEHeader, sanitizeVersion, sanitizeFilename } from "@/lib/validation";
import { FILE_UPLOAD } from "@/lib/constants";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/app/upload
 * Admin endpoint to upload desktop app file
 * Replaces previous version automatically
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in",
        },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get user and check if admin
    const user = await User.findOne({ email: session.user.email });
    if (!user || (user.role !== "admin" && user.role !== "tester")) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only admins can upload app files",
        },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const version = formData.get("version") as string;
    const releaseNotes = formData.get("releaseNotes") as string;

    // Validation
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing file",
          message: "No file provided",
        },
        { status: 400 }
      );
    }

    if (!version) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing version",
          message: "Version number is required",
        },
        { status: 400 }
      );
    }

    // Validate file metadata (extension, MIME type, size)
    const fileValidation = validateFileUpload(file, FILE_UPLOAD.MAX_APP_FILE_SIZE);
    if (!fileValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file",
          message: fileValidation.error,
        },
        { status: 400 }
      );
    }

    // Sanitize version to prevent directory traversal
    const safeVersion = sanitizeVersion(version);
    if (!safeVersion || !FILE_UPLOAD.ALLOWED_VERSION_PATTERN.test(safeVersion)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid version",
          message: "Invalid version format. Use X.Y.Z format",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer for content validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate PE header to ensure it's a real Windows executable
    if (!validatePEHeader(buffer)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid executable",
          message: "Invalid executable file. File does not have a valid PE header",
        },
        { status: 400 }
      );
    }

    // Create uploads directory in public folder
    const uploadsDir = path.join(process.cwd(), "public", "downloads");
    
    // Generate unique, sanitized filename
    const timestamp = Date.now();
    const sanitizedOriginalName = sanitizeFilename(file.name);
    const filename = `phishguard-${safeVersion}-${timestamp}.exe`;
    const filepath = path.join(uploadsDir, filename);
    const publicFilepath = `/downloads/${filename}`;

    // Write file to disk (buffer already created during PE header validation)
    await writeFile(filepath, buffer);

    logger.info(`App upload: File saved to ${filepath}`);

    // Get current active download to mark as inactive
    const currentActive = await AppDownload.findOne({ active: true });
    let previousFilepath = null;

    if (currentActive) {
      previousFilepath = currentActive.filepath;
      // Mark as inactive instead of deleting immediately
      currentActive.active = false;
      await currentActive.save();

      // Try to delete old file (non-blocking)
      try {
        await unlink(path.join(process.cwd(), "public", previousFilepath.replace(/^\/?downloads\//, "downloads/")));
        logger.info(`App upload: Deleted old file ${previousFilepath}`);
      } catch (error) {
        logger.warn(`App upload: Could not delete old file ${previousFilepath}`, { error });
      }
    }

    // Create new download record
    const appDownload = new AppDownload({
      filename,
      originalFilename: sanitizedOriginalName,
      filepath: publicFilepath,
      filesize: file.size,
      mimetype: file.type,
      version: safeVersion,
      releaseNotes: releaseNotes || "",
      uploadedBy: user._id,
      uploadedAt: new Date(),
      downloadCount: 0,
      active: true,
      previousFilepath,
    });

    await appDownload.save();

    logger.info(`App upload: New version ${safeVersion} uploaded by ${user.email}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: appDownload._id,
          filename: appDownload.filename,
          originalFilename: appDownload.originalFilename,
          version: appDownload.version,
          filesize: appDownload.filesize,
          uploadedAt: appDownload.uploadedAt,
          releaseNotes: appDownload.releaseNotes,
        },
        message: "App file uploaded successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('App upload error', error);
    return NextResponse.json(
      {
        success: false,
        error: "Upload failed",
        message: error.message || "An error occurred during upload",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/app/upload
 * Get all app upload history (for admin dashboard)
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in",
        },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get user and check if admin
    const user = await User.findOne({ email: session.user.email });
    if (!user || (user.role !== "admin" && user.role !== "tester")) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only admins can view app uploads",
        },
        { status: 403 }
      );
    }

    // Get all downloads sorted by upload date (newest first)
    const downloads = await AppDownload.find()
      .sort({ uploadedAt: -1 })
      .populate("uploadedBy", "email name")
      .lean();

    // Separate active and inactive
    const active = downloads.find((d) => d.active);
    const history = downloads.filter((d) => !d.active);

    return NextResponse.json(
      {
        success: true,
        data: {
          current: active || null,
          history,
        },
        message: "App uploads retrieved successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('App upload GET error', error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
