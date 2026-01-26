import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AppDownload from "@/lib/models/AppDownload";

/**
 * GET /api/app/download-info
 * Public endpoint to get current downloadable app info
 * Returns metadata about the latest version
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get active download
    const appDownload = await AppDownload.findOne({ active: true })
      .populate("uploadedBy", "email name")
      .lean();

    if (!appDownload) {
      return NextResponse.json(
        {
          success: false,
          error: "No download available",
          message: "The desktop application is not available for download at this time",
        },
        { status: 404 }
      );
    }

    // Increment download count (for analytics)
    await AppDownload.updateOne(
      { _id: appDownload._id },
      { $inc: { downloadCount: 1 } }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: appDownload._id,
          filename: appDownload.filename,
          originalFilename: appDownload.originalFilename,
          version: appDownload.version,
          filesize: appDownload.filesize,
          downloadUrl: appDownload.filepath, // e.g., /downloads/phishguard-1.0.0-timestamp.exe
          releaseNotes: appDownload.releaseNotes,
          uploadedAt: appDownload.uploadedAt,
          downloadCount: appDownload.downloadCount,
          uploadedBy: appDownload.uploadedBy,
        },
        message: "Download info retrieved successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[App Download Info] Error:", error);
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
