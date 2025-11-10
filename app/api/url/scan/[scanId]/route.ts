import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Scan from "@/lib/models/Scan";
import Log from "@/lib/models/Log";

/**
 * GET /api/url/scan/[scanId]
 * Get detailed scan results by scanId
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to view scan details",
        },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          message: "User account not found",
        },
        { status: 404 }
      );
    }

    const { scanId } = await params;

    // Find scan
    const scan = await Scan.findOne({ scanId, userId: user._id }).lean();

    if (!scan) {
      return NextResponse.json(
        {
          success: false,
          error: "Not found",
          message: "Scan not found or you don't have permission to view it",
        },
        { status: 404 }
      );
    }

    // Return full scan details
    return NextResponse.json(
      {
        success: true,
        data: {
          scanId: scan.scanId,
          url: scan.url,
          status: scan.status,
          score: scan.score,
          confidence: scan.confidence,
          verdict: scan.verdict,
          analysis: scan.analysis,
          factors: scan.factors,
          recommendation: scan.recommendation,
          localScore: scan.localScore,
          localFactors: scan.localFactors,
          context: scan.context,
          timestamp: scan.timestamp,
          processingTime: scan.processingTime,
          synced: scan.synced,
        },
        message: "Scan details retrieved successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get scan details error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An error occurred while retrieving scan details",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/url/scan/[scanId]
 * Delete a scan from history
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to delete scans",
        },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          message: "User account not found",
        },
        { status: 404 }
      );
    }

    const { scanId } = await params;

    // Find and delete scan
    const scan = await Scan.findOneAndDelete({ scanId, userId: user._id });

    if (!scan) {
      return NextResponse.json(
        {
          success: false,
          error: "Not found",
          message: "Scan not found or you don't have permission to delete it",
        },
        { status: 404 }
      );
    }

    // Log the deletion
    await Log.create({
      userId: user._id,
      action: "url_scan_deleted",
      details: {
        scanId,
        url: scan.url,
        status: scan.status,
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      timestamp: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Scan deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete scan error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An error occurred while deleting the scan",
      },
      { status: 500 }
    );
  }
}
