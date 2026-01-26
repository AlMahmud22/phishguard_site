import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import AppDownload from "@/lib/models/AppDownload";
import { writeFile, unlink } from "fs/promises";
import path from "path";

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

    // Validate file type (only .exe for Windows)
    const validMimeTypes = [
      "application/x-msdownload",
      "application/octet-stream",
      "application/x-msdos-program",
    ];
    if (!validMimeTypes.includes(file.type) && !file.name.endsWith(".exe")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type",
          message: "Only .exe files are allowed",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB)
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "File too large",
          message: "File must be smaller than 500MB",
        },
        { status: 400 }
      );
    }

    // Create uploads directory in public folder
    const uploadsDir = path.join(process.cwd(), "public", "downloads");
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `phishguard-${version}-${timestamp}.exe`;
    const filepath = path.join(uploadsDir, filename);
    const publicFilepath = `/downloads/${filename}`;

    // Write file to disk
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    console.log(`[App Upload] File saved to: ${filepath}`);

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
        console.log(`[App Upload] Deleted old file: ${previousFilepath}`);
      } catch (error) {
        console.warn(`[App Upload] Could not delete old file: ${error}`);
      }
    }

    // Create new download record
    const appDownload = new AppDownload({
      filename,
      originalFilename: file.name,
      filepath: publicFilepath,
      filesize: file.size,
      mimetype: file.type,
      version,
      releaseNotes: releaseNotes || "",
      uploadedBy: user._id,
      uploadedAt: new Date(),
      downloadCount: 0,
      active: true,
      previousFilepath,
    });

    await appDownload.save();

    console.log(`[App Upload] New version ${version} uploaded by ${user.email}`);

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
    console.error("[App Upload] Error:", error);
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
    console.error("[App Upload GET] Error:", error);
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
