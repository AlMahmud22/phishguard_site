import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authMiddleware";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Scan from "@/lib/models/Scan";
import { createSuccessResponse, ErrorResponses } from "@/lib/apiResponse";

/**
 * GET /api/user/stats
 * Get user scanning statistics and analytics
 * Supports both NextAuth sessions and JWT tokens
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication (supports JWT and NextAuth)
    const authUser = await requireAuth(req);
    await dbConnect();

    // Get user
    const user = await User.findById(authUser.id);

    if (!user) {
      return ErrorResponses.notFound("User not found");
    }

    // Get period parameter
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get("period") || "all";

    // Calculate date ranges based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Build query with period filter
    const periodQuery = period === "all" ? {} : { timestamp: { $gte: startDate } };
    const baseQuery = { userId: user._id };
    const query = { ...baseQuery, ...periodQuery };

    // Calculate other date ranges for activity section
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get statistics for the selected period
    const [
      totalScans,
      safeCount,
      warningCount,
      dangerCount,
      todayScans,
      weekScans,
      monthScans,
    ] = await Promise.all([
      Scan.countDocuments(query),
      Scan.countDocuments({ ...query, status: "safe" }),
      Scan.countDocuments({ ...query, status: "warning" }),
      Scan.countDocuments({ ...query, status: "danger" }),
      Scan.countDocuments({ userId: user._id, timestamp: { $gte: dayAgo } }),
      Scan.countDocuments({ userId: user._id, timestamp: { $gte: weekAgo } }),
      Scan.countDocuments({ userId: user._id, timestamp: { $gte: monthAgo } }),
      Scan.countDocuments({ userId: user._id, status: "safe" }),
      Scan.countDocuments({ userId: user._id, status: "warning" }),
      Scan.countDocuments({ userId: user._id, status: "danger" }),
      Scan.countDocuments({ userId: user._id, timestamp: { $gte: dayAgo } }),
      Scan.countDocuments({ userId: user._id, timestamp: { $gte: weekAgo } }),
      Scan.countDocuments({ userId: user._id, timestamp: { $gte: monthAgo } }),
    ]);

    // Get average score for the period
    const avgScoreResult = await Scan.aggregate([
      { $match: query },
      { $group: { _id: null, avgScore: { $avg: "$score" } } },
    ]);
    const averageScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

    // Get most scanned domains (top 10) for the period
    const topDomains = await Scan.aggregate([
      { $match: query },
      { $group: { _id: "$analysis.domain.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { domain: "$_id", count: 1, _id: 0 } },
    ]);

    // Get recent dangerous URLs (last 10) for the period
    const recentDangers = await Scan.find({
      ...query,
      status: "danger",
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .select("scanId url status score timestamp factors")
      .lean();

    // Get scanning activity by day (respecting period, but limited to reasonable timeframe)
    const activityStartDate = period === "all" || period === "year" ? monthAgo : startDate;
    const activityByDay = await Scan.aggregate([
      {
        $match: {
          userId: user._id,
          timestamp: { $gte: activityStartDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
          safe: {
            $sum: { $cond: [{ $eq: ["$status", "safe"] }, 1, 0] },
          },
          warning: {
            $sum: { $cond: [{ $eq: ["$status", "warning"] }, 1, 0] },
          },
          danger: {
            $sum: { $cond: [{ $eq: ["$status", "danger"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          count: 1,
          safe: 1,
          warning: 1,
          danger: 1,
          _id: 0,
        },
      },
    ]);

    // Get rate limit info
    const limits = user.isPremium
      ? { hourly: 1000, daily: 10000, monthly: 100000 }
      : { hourly: 100, daily: 500, monthly: 5000 };

    const [hourlyUsage, dailyUsage, monthlyUsage] = await Promise.all([
      Scan.countDocuments({ userId: user._id, timestamp: { $gte: hourAgo } }),
      Scan.countDocuments({ userId: user._id, timestamp: { $gte: dayAgo } }),
      Scan.countDocuments({ userId: user._id, timestamp: { $gte: monthAgo } }),
    ]);

    // Get threat detection stats
    const threatsDetected = dangerCount + warningCount;
    const threatsBlocked = dangerCount;

    // Calculate streak (consecutive days with at least one scan)
    const allScans = await Scan.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .select("timestamp")
      .lean();

    let streak = 0;
    if (allScans.length > 0) {
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < allScans.length; i++) {
        const scanDate = new Date(allScans[i].timestamp);
        scanDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor(
          (currentDate.getTime() - scanDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === streak) {
          streak++;
          currentDate = scanDate;
        } else if (daysDiff > streak) {
          break;
        }
      }
    }

    // Return statistics
    return createSuccessResponse(
      {
        overview: {
        totalScans,
        safeCount,
        warningCount,
        dangerCount,
        averageScore,
        threatsDetected,
        threatsBlocked,
      },
      activity: {
        today: todayScans,
        thisWeek: weekScans,
        thisMonth: monthScans,
        streak,
      },
      limits: {
        hourly: {
          limit: limits.hourly,
          used: hourlyUsage,
          remaining: limits.hourly - hourlyUsage,
        },
        daily: {
          limit: limits.daily,
          used: dailyUsage,
          remaining: limits.daily - dailyUsage,
        },
        monthly: {
          limit: limits.monthly,
          used: monthlyUsage,
          remaining: limits.monthly - monthlyUsage,
        },
      },
      topDomains,
      recentDangers: recentDangers.map((scan) => ({
        scanId: scan.scanId,
        url: scan.url,
        status: scan.status,
        score: scan.score,
        timestamp: scan.timestamp,
        factors: scan.factors,
      })),
      activityByDay,
      accountInfo: {
        isPremium: user.isPremium,
        memberSince: user.createdAt,
      },
    },
    "Statistics retrieved successfully"
    );
  } catch (error: any) {
    console.error("Get user stats error:", error);
    return ErrorResponses.internalError(
      "An error occurred while retrieving statistics"
    );
  }
}
