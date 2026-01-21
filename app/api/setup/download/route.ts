import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SetupFile from "@/lib/models/SetupFile";
import path from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get the active setup file
    const setupFile = await SetupFile.findOne({ isActive: true }).sort({ uploadedAt: -1 });

    if (!setupFile) {
      return NextResponse.json(
        { success: false, message: "No setup file available" },
        { status: 404 }
      );
    }

    // Increment download count
    setupFile.downloadCount += 1;
    await setupFile.save();

    // Read the file
    const filePath = path.join(process.cwd(), "public", "uploads", "setup", setupFile.filename);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: "Setup file not found on server" },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(filePath);

    // Return file as download
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${setupFile.originalName}"`,
        "Content-Length": setupFile.fileSize.toString(),
      },
    });
  } catch (error: any) {
    console.error("Setup file download error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to download setup file" },
      { status: 500 }
    );
  }
}
