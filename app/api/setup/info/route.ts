import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SetupFile from "@/lib/models/SetupFile";

export async function GET() {
  try {
    await connectDB();

    const setupFile = await SetupFile.findOne({ isActive: true }).sort({ uploadedAt: -1 });

    if (!setupFile) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        filename: setupFile.originalName,
        version: setupFile.version,
        fileSize: setupFile.fileSize,
        uploadedAt: setupFile.uploadedAt,
        downloadCount: setupFile.downloadCount,
      },
    });
  } catch (error: any) {
    console.error("Setup file info error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch setup file info" },
      { status: 500 }
    );
  }
}
