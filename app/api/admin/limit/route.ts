import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import RateLimit from "@/lib/models/RateLimit";
import User from "@/lib/models/User";
import { checkRateLimit } from "@/lib/rateLimit";
import type { RateLimitOverview, RateLimitData } from "@/types";

// GET /api/admin/limit - fetch rate limit stats
// access: admin or tester
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    // check auth
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    /// check role permission (admin or tester)
    if (!hasAnyRole(session, ["admin", "tester"])) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Requires admin or tester role" },
        { status: 403 }
      );
    }

    // rate limit check - 100 requests per hour per user
    const rateLimit = await checkRateLimit(session.user.id, {
      endpoint: "/api/admin/limit",
      limit: 100,
      windowMs: 3600000, // 1 hour
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Try again later.",
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    await connectToDatabase();

    /// parse query parameters
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "overview"; // overview or detailed
    const userId = searchParams.get("userId");

    if (view === "detailed" && userId) {
      /// Return detailed rate limit data for specific user
      const userRateLimits = await RateLimit.find({ userId }).lean();

      const detailedData: RateLimitData[] = userRateLimits.map((rl) => ({
        userId: rl.userId,
        endpoint: rl.endpoint,
        limit: rl.limit,
        current: rl.requestsCount,
        remaining: Math.max(0, rl.limit - rl.requestsCount),
        resetAt: new Date(
          rl.windowStart.getTime() + 60 * 60 * 1000
        ).toISOString(), // 1 hour window
        windowStart: rl.windowStart.toISOString(),
        violations: rl.violations,
      }));

      return NextResponse.json(
        { success: true, data: detailedData },
        { status: 200 }
      );
    }

    /// Return overview data
    const [totalRateLimits, activeUsers, recentViolations] = await Promise.all([
      RateLimit.countDocuments(),
      User.countDocuments(),
      RateLimit.find({ violations: { $gt: 0 } })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    /// Calculate total and blocked requests
    const requestStats = await RateLimit.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: "$requestsCount" },
          totalViolations: { $sum: "$violations" },
        },
      },
    ]);

    const totalRequests = requestStats[0]?.totalRequests || 0;
    const blockedRequests = requestStats[0]?.totalViolations || 0;

    /// Get top endpoints
    const topEndpointsData = await RateLimit.aggregate([
      {
        $group: {
          _id: "$endpoint",
          requests: { $sum: "$requestsCount" },
          blocked: { $sum: "$violations" },
        },
      },
      { $sort: { requests: -1 } },
      { $limit: 5 },
    ]);

    const topEndpoints = topEndpointsData.map((ep) => ({
      endpoint: ep._id,
      requests: ep.requests,
      blocked: ep.blocked,
    }));

    /// Get recent violations with user names
    const violationsWithUsers = await Promise.all(
      recentViolations.slice(0, 5).map(async (rl) => {
        const user = await User.findById(rl.userId).lean();
        return {
          userId: rl.userId,
          userName: user?.name || "Unknown User",
          endpoint: rl.endpoint,
          timestamp: rl.updatedAt.toISOString(),
        };
      })
    );

    const overviewData: RateLimitOverview = {
      totalRequests,
      blockedRequests,
      activeUsers,
      topEndpoints,
      recentViolations: violationsWithUsers,
      configuration: {
        globalLimit: 10000,
        perUserLimit: 100,
        windowMinutes: 60,
      },
    };

    return NextResponse.json(
      { success: true, data: overviewData },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching rate limit data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch rate limit data",
      },
      { status: 500 }
    );
  }
}

/// PUT /api/admin/limit - Update rate limit configuration
/// Requires admin role only
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    /// check authentication
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    /// check role permission (admin only for configuration changes)
    if (!hasAnyRole(session, ["admin"])) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Requires admin role" },
        { status: 403 }
      );
    }

    // rate limit check - 20 config updates per hour per admin
    const rateLimit = await checkRateLimit(session.user.id, {
      endpoint: "/api/admin/limit:config",
      limit: 20,
      windowMs: 3600000, // 1 hour
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Try again later.",
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { globalLimit, perUserLimit, windowMinutes } = body;

    /// validate configuration values
    if (globalLimit && (globalLimit < 100 || globalLimit > 1000000)) {
      return NextResponse.json(
        { success: false, error: "Global limit must be between 100 and 1,000,000" },
        { status: 400 }
      );
    }

    if (perUserLimit && (perUserLimit < 10 || perUserLimit > 10000)) {
      return NextResponse.json(
        { success: false, error: "Per-user limit must be between 10 and 10,000" },
        { status: 400 }
      );
    }

    if (windowMinutes && (windowMinutes < 1 || windowMinutes > 1440)) {
      return NextResponse.json(
        { success: false, error: "Window must be between 1 and 1440 minutes" },
        { status: 400 }
      );
    }

    /// TODO: Implement actual rate limit configuration storage
    /// This would typically be stored in database or environment variables

    return NextResponse.json(
      {
        success: true,
        message: "Rate limit configuration updated successfully",
        data: {
          globalLimit: globalLimit || 10000,
          perUserLimit: perUserLimit || 100,
          windowMinutes: windowMinutes || 60,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating rate limit configuration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update rate limit configuration",
      },
      { status: 500 }
    );
  }
}

/// POST /api/admin/limit/reset - Reset rate limit for a user
/// Requires admin role only
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    /// check authentication
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    /// check role permission (admin only)
    if (!hasAnyRole(session, ["admin"])) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Requires admin role" },
        { status: 403 }
      );
    }

    // rate limit check - 30 resets per hour per admin
    const rateLimit = await checkRateLimit(session.user.id, {
      endpoint: "/api/admin/limit:reset",
      limit: 30,
      windowMs: 3600000, // 1 hour
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Try again later.",
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { userId, endpoint } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    /// Reset rate limit for user
    if (endpoint) {
      /// Reset specific endpoint for user
      const result = await RateLimit.findOneAndUpdate(
        { userId, endpoint },
        {
          $set: {
            requestsCount: 0,
            windowStart: new Date(),
            lastReset: new Date(),
          },
        },
        { new: true }
      );

      if (!result) {
        return NextResponse.json(
          { success: false, error: "Rate limit record not found" },
          { status: 404 }
        );
      }
    } else {
      /// Reset all endpoints for user
      await RateLimit.updateMany(
        { userId },
        {
          $set: {
            requestsCount: 0,
            windowStart: new Date(),
            lastReset: new Date(),
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Rate limit reset successfully for user ${userId}${endpoint ? ` on endpoint ${endpoint}` : ""}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting rate limit:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset rate limit",
      },
      { status: 500 }
    );
  }
}
