import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import SetupFile from "@/lib/models/SetupFile";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

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

    // Validate file type (only .exe allowed)
    if (!file.name.endsWith(".exe")) {
      return NextResponse.json(
        { success: false, message: "Only .exe files are allowed" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "setup");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `PhishGuard-Setup-${timestamp}.exe`;
    const filePath = path.join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Connect to database
    await connectDB();

    // Deactivate all previous setup files
    await SetupFile.updateMany({}, { isActive: false });

    // Create new setup file record
    const setupFile = new SetupFile({
      filename,
      originalName: file.name,
      fileSize: file.size,
      filePath: `/uploads/setup/${filename}`,
      version,
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
