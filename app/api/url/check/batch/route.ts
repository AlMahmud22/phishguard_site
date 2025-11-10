import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Scan from "@/lib/models/Scan";
import Log from "@/lib/models/Log";
import { scanUrl } from "@/lib/scanner";
import { nanoid } from "nanoid";

/**
 * POST /api/url/check/batch
 * Scan multiple URLs in parallel
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to scan URLs",
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

    // Parse request body
    const body = await req.json();
    const { urls, context, userAgent } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          message: "URLs array is required and must not be empty",
        },
        { status: 400 }
      );
    }

    if (urls.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          message: "Maximum 50 URLs per batch request",
        },
        { status: 400 }
      );
    }

    // Check rate limits
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [hourlyCount, dailyCount, monthlyCount] = await Promise.all([
      Scan.countDocuments({ userId: user._id, timestamp: { $gte: hourAgo } }),
      Scan.countDocuments({ userId: user._id, timestamp: { $gte: dayAgo } }),
      Scan.countDocuments({ userId: user._id, timestamp: { $gte: monthAgo } }),
    ]);

    // Rate limits
    const limits = user.isPremium
      ? { hourly: 1000, daily: 10000, monthly: 100000 }
      : { hourly: 100, daily: 500, monthly: 5000 };

    const batchSize = urls.length;

    if (hourlyCount + batchSize > limits.hourly) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: `Batch scan would exceed hourly limit (${limits.hourly} scans/hour)`,
          limits: {
            hourly: limits.hourly,
            daily: limits.daily,
            monthly: limits.monthly,
            current: {
              hourly: hourlyCount,
              daily: dailyCount,
              monthly: monthlyCount,
            },
            requested: batchSize,
          },
        },
        { status: 429 }
      );
    }

    if (dailyCount + batchSize > limits.daily) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: `Batch scan would exceed daily limit (${limits.daily} scans/day)`,
          limits: {
            hourly: limits.hourly,
            daily: limits.daily,
            monthly: limits.monthly,
            current: {
              hourly: hourlyCount,
              daily: dailyCount,
              monthly: monthlyCount,
            },
            requested: batchSize,
          },
        },
        { status: 429 }
      );
    }

    if (monthlyCount + batchSize > limits.monthly) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: `Batch scan would exceed monthly limit (${limits.monthly} scans/month)`,
          limits: {
            hourly: limits.hourly,
            daily: limits.daily,
            monthly: limits.monthly,
            current: {
              hourly: hourlyCount,
              daily: dailyCount,
              monthly: monthlyCount,
            },
            requested: batchSize,
          },
        },
        { status: 429 }
      );
    }

    // Scan all URLs in parallel
    const scanPromises = urls.map(async (urlData: any) => {
      const url = typeof urlData === "string" ? urlData : urlData.url;
      const localScore = typeof urlData === "object" ? urlData.localScore : undefined;
      const localFactors = typeof urlData === "object" ? urlData.localFactors : undefined;

      try {
        const scanResult = await scanUrl(url, localScore, localFactors);
        const scanId = `scn_${Date.now()}_${nanoid(10)}`;
        const timestamp = new Date();

        // Save scan to database
        await Scan.create({
          userId: user._id,
          scanId,
          url,
          status: scanResult.status,
          score: scanResult.score,
          confidence: scanResult.confidence,
          verdict: scanResult.verdict,
          analysis: scanResult.analysis,
          factors: scanResult.factors,
          recommendation: scanResult.recommendation,
          localScore,
          localFactors,
          context,
          synced: true,
          timestamp,
        });

        return {
          success: true,
          scanId,
          url,
          status: scanResult.status,
          score: scanResult.score,
          confidence: scanResult.confidence,
          verdict: scanResult.verdict,
          factors: scanResult.factors,
          recommendation: scanResult.recommendation,
          timestamp: timestamp.toISOString(),
        };
      } catch (error: any) {
        return {
          success: false,
          url,
          error: error.message || "Scan failed",
        };
      }
    });

    const results = await Promise.all(scanPromises);

    // Count successes and failures
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    // Count by status
    const safeCount = results.filter((r) => r.success && r.status === "safe").length;
    const warningCount = results.filter((r) => r.success && r.status === "warning").length;
    const dangerCount = results.filter((r) => r.success && r.status === "danger").length;

    // Log the action
    await Log.create({
      userId: user._id,
      action: "url_batch_scan",
      details: {
        totalUrls: urls.length,
        successCount,
        failureCount,
        safeCount,
        warningCount,
        dangerCount,
        context,
        userAgent,
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      timestamp: new Date(),
    });

    // Update user scan quota
    await User.updateOne(
      { _id: user._id },
      {
        $inc: {
          "scanQuota.hourly": successCount,
          "scanQuota.daily": successCount,
          "scanQuota.monthly": successCount,
        },
        $set: {
          "scanQuota.lastReset": now,
        },
      }
    );

    const processingTime = Date.now() - startTime;

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          results,
          summary: {
            total: urls.length,
            successful: successCount,
            failed: failureCount,
            safe: safeCount,
            warning: warningCount,
            danger: dangerCount,
          },
          processingTime,
        },
        message: `Batch scan completed: ${successCount}/${urls.length} URLs scanned successfully`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Batch URL scan error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An error occurred while scanning URLs",
      },
      { status: 500 }
    );
  }
}
