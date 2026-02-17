import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import SetupFile from "@/lib/models/SetupFile";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { validateFileUpload, validatePEHeader, sanitizeVersion, sanitizeFilename } from "@/lib/validation";
import { FILE_UPLOAD } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    // Check authentication and admin role
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const version = formData.get("version") as string || "1.0.0";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file metadata (extension, MIME type, size)
    const fileValidation = validateFileUpload(file, FILE_UPLOAD.MAX_SETUP_FILE_SIZE);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { success: false, message: fileValidation.error },
        { status: 400 }
      );
    }

    // Sanitize version to prevent directory traversal
    const safeVersion = sanitizeVersion(version);
    if (!safeVersion || !FILE_UPLOAD.ALLOWED_VERSION_PATTERN.test(safeVersion)) {
      return NextResponse.json(
        { success: false, message: "Invalid version format. Use X.Y.Z format" },
        { status: 400 }
      );
    }

    // Convert file to buffer for content validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate PE header to ensure it's a real Windows executable
    if (!validatePEHeader(buffer)) {
      return NextResponse.json(
        { success: false, message: "Invalid executable file. File does not have a valid PE header" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "setup");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique, sanitized filename
    const timestamp = Date.now();
    const sanitizedOriginalName = sanitizeFilename(file.name);
    const filename = `PhishGuard-Setup-${safeVersion}-${timestamp}.exe`;
    const filePath = path.join(uploadsDir, filename);

    // Save file (buffer already created during PE header validation)
    await writeFile(filePath, buffer);

    // Connect to database
    await connectDB();

    // Deactivate all previous setup files
    await SetupFile.updateMany({}, { isActive: false });

    // Create new setup file record
    const setupFile = new SetupFile({
      filename,
      originalName: sanitizedOriginalName,
      fileSize: file.size,
      filePath: `/uploads/setup/${filename}`,
      version: safeVersion,
      uploadedBy: session.user.id,
      isActive: true,
      downloadCount: 0,
    });

    await setupFile.save();

    return NextResponse.json({
      success: true,
      message: "Setup file uploaded successfully",
      data: {
        filename: setupFile.filename,
        version: setupFile.version,
        uploadedAt: setupFile.uploadedAt,
      },
    });
  } catch (error: any) {
    console.error("Setup file upload error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload setup file" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const setupFiles = await SetupFile.find()
      .populate("uploadedBy", "name email")
      .sort({ uploadedAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: setupFiles,
    });
  } catch (error: any) {
    console.error("Setup file fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch setup files" },
      { status: 500 }
    );
  }
}
