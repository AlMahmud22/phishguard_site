import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Log from "@/lib/models/Log";
import User from "@/lib/models/User";
import { checkRateLimit } from "@/lib/rateLimit";
import type { ActivityData } from "@/types";

// GET /api/admin/activity - fetch realtime activity metrics
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

    // check role
    if (!hasAnyRole(session, ["admin", "tester"])) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Requires admin or tester role" },
        { status: 403 }
      );
    }

    // rate limit check - 120 requests per hour per user (higher for dashboard)
    const rateLimit = await checkRateLimit(session.user.id, {
      endpoint: "/api/admin/activity",
      limit: 120,
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

    // calculate time ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    /// Get active users counts
    const [totalUsers, usersToday, usersThisWeek, usersThisMonth] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: today } }),
        User.countDocuments({ createdAt: { $gte: thisWeek } }),
        User.countDocuments({ createdAt: { $gte: thisMonth } }),
      ]);

    /// Get login activity from logs
    const recentLogins = await Log.countDocuments({
      action: { $regex: /login/i },
      timestamp: { $gte: last24Hours },
    });

    /// Get scan activity from logs (URL Scan actions)
    const [totalScans, scansToday, scansThisWeek, scansThisMonth] =
      await Promise.all([
        Log.countDocuments({ action: { $regex: /scan/i } }),
        Log.countDocuments({
          action: { $regex: /scan/i },
          timestamp: { $gte: today },
        }),
        Log.countDocuments({
          action: { $regex: /scan/i },
          timestamp: { $gte: thisWeek },
        }),
        Log.countDocuments({
          action: { $regex: /scan/i },
          timestamp: { $gte: thisMonth },
        }),
      ]);

    /// Get scans by hour for the last 24 hours
    const scansByHour = await Log.aggregate([
      {
        $match: {
          action: { $regex: /scan/i },
          timestamp: { $gte: last24Hours },
        },
      },
      {
        $group: {
          _id: { $hour: "$timestamp" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    /// Format scans by hour (fill in missing hours with 0)
    const hourlyScans = Array.from({ length: 24 }, (_, i) => {
      const hourData = scansByHour.find((s) => s._id === i);
      return {
        hour: `${i.toString().padStart(2, "0")}:00`,
        count: hourData ? hourData.count : 0,
      };
    });

    /// Get threat statistics from logs
    const [detectedThreats, blockedThreats, errorLogs] = await Promise.all([
      Log.countDocuments({
        level: { $in: ["warning", "critical"] },
        timestamp: { $gte: thisMonth },
      }),
      Log.countDocuments({
        action: { $regex: /block|prevent|stop/i },
        timestamp: { $gte: thisMonth },
      }),
      Log.countDocuments({
        level: "error",
        timestamp: { $gte: thisMonth },
      }),
    ]);

    /// Get top suspicious domains from logs (mock for now as we'd need scan results)
    const topDomains = [
      {
        domain: "suspicious-site.com",
        count: 45,
        lastSeen: new Date(Date.now() - 300000).toISOString(),
      },
      {
        domain: "phishing-example.net",
        count: 38,
        lastSeen: new Date(Date.now() - 600000).toISOString(),
      },
      {
        domain: "malware-host.org",
        count: 29,
        lastSeen: new Date(Date.now() - 900000).toISOString(),
      },
      {
        domain: "fake-bank.co",
        count: 23,
        lastSeen: new Date(Date.now() - 1200000).toISOString(),
      },
      {
        domain: "scam-shop.biz",
        count: 18,
        lastSeen: new Date(Date.now() - 1500000).toISOString(),
      },
    ];

    /// System metrics
    const uptime = process.uptime();
    const memoryUsage = (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100;

    const activityData: ActivityData = {
      activeUsers: {
        current: recentLogins,
        today: usersToday,
        thisWeek: usersThisWeek,
        thisMonth: usersThisMonth,
      },
      scans: {
        total: totalScans,
        today: scansToday,
        thisWeek: scansThisWeek,
        thisMonth: scansThisMonth,
        byHour: hourlyScans,
      },
      threats: {
        detected: detectedThreats,
        blocked: blockedThreats,
        falsePositives: Math.floor(errorLogs * 0.1), // Estimate
        topDomains,
      },
      system: {
        uptime: Math.floor(uptime),
        responseTime: Math.floor(Math.random() * 200) + 50, // Would need request tracking
        errorRate: errorLogs > 0 ? (errorLogs / totalScans) * 100 : 0,
        memoryUsage: Math.round(memoryUsage * 100) / 100,
      },
    };

    return NextResponse.json(
      { success: true, data: activityData },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching activity data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch activity data",
      },
      { status: 500 }
    );
  }
}
