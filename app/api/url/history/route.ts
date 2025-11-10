import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Scan from "@/lib/models/Scan";

/**
 * GET /api/url/history
 * Get user's scan history with pagination and filters
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
          message: "You must be logged in to view scan history",
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

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    // Build query
    const query: any = { userId: user._id };

    if (status && ["safe", "warning", "danger"].includes(status)) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.$or = [
        { url: { $regex: search, $options: "i" } },
        { "analysis.domain.name": { $regex: search, $options: "i" } },
        { factors: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Scan.countDocuments(query);

    // Calculate pagination
    const skip = (page - 1) * limit;
    const pages = Math.ceil(total / limit);
    const hasMore = page < pages;

    // Get scans
    const scans = await Scan.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v")
      .lean();

    // Get statistics
    const [safeCount, warningCount, dangerCount] = await Promise.all([
      Scan.countDocuments({ userId: user._id, status: "safe" }),
      Scan.countDocuments({ userId: user._id, status: "warning" }),
      Scan.countDocuments({ userId: user._id, status: "danger" }),
    ]);

    const totalScans = safeCount + warningCount + dangerCount;

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          scans: scans.map((scan) => ({
            scanId: scan.scanId,
            url: scan.url,
            status: scan.status,
            score: scan.score,
            confidence: scan.confidence,
            verdict: scan.verdict,
            factors: scan.factors,
            recommendation: scan.recommendation,
            timestamp: scan.timestamp,
            processingTime: scan.processingTime,
            context: scan.context,
          })),
          pagination: {
            page,
            limit,
            total,
            pages,
            hasMore,
          },
          stats: {
            totalScans,
            safeCount,
            warningCount,
            dangerCount,
          },
        },
        message: "Scan history retrieved successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get scan history error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An error occurred while retrieving scan history",
      },
      { status: 500 }
    );
  }
}
