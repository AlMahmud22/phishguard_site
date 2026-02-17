import { NextRequest, NextResponse } from "next/server";
import validator from "validator";
import pLimit from "p-limit";
import { RATE_LIMITS, INPUT_LIMITS, SCAN_CONTEXTS } from "@/lib/constants";
import { requireAuth } from "@/lib/authMiddleware";
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
    // Check authentication - supports JWT, desktop key, and NextAuth sessions
    const authUser = await requireAuth(req);

    await dbConnect();

    // Get user
    const user = await User.findById(authUser.id);
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
    let { urls, context, userAgent } = body;

    // Validate URLs array
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

    // Enforce maximum batch size
    if (urls.length > RATE_LIMITS.MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          message: `Maximum ${RATE_LIMITS.MAX_BATCH_SIZE} URLs per batch request`,
        },
        { status: 400 }
      );
    }

    // Validate and sanitize each URL
    const sanitizedUrls: string[] = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (!url || typeof url !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request",
            message: `URL at index ${i} is invalid`,
          },
          { status: 400 }
        );
      }
      
      const urlToValidate = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      if (!validator.isURL(urlToValidate, { require_protocol: false, require_valid_protocol: true })) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request",
            message: `URL at index ${i} has invalid format: ${url}`,
          },
          { status: 400 }
        );
      }
      
      sanitizedUrls.push(validator.trim(url));
    }

    // Sanitize optional parameters
    if (context && typeof context === 'string') {
      if (!SCAN_CONTEXTS.includes(context as any)) {
        context = undefined; // Invalid context, ignore it
      }
    }
    if (userAgent && typeof userAgent === 'string') {
      userAgent = validator.escape(userAgent).substring(0, INPUT_LIMITS.MAX_USER_AGENT_LENGTH);
    }

    // Replace original urls with sanitized ones
    urls = sanitizedUrls;

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
      ? RATE_LIMITS.PREMIUM
      : RATE_LIMITS.FREE;

    const batchSize = urls.length;

    if (hourlyCount + batchSize > limits.HOURLY) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: `Batch scan would exceed hourly limit (${limits.HOURLY} scans/hour)`,
          limits: {
            hourly: limits.HOURLY,
            daily: limits.DAILY,
            monthly: limits.MONTHLY,
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

    if (dailyCount + batchSize > limits.DAILY) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: `Batch scan would exceed daily limit (${limits.DAILY} scans/day)`,
          limits: {
            hourly: limits.HOURLY,
            daily: limits.DAILY,
            monthly: limits.MONTHLY,
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

    if (monthlyCount + batchSize > limits.MONTHLY) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: `Batch scan would exceed monthly limit (${limits.MONTHLY} scans/month)`,
          limits: {
            hourly: limits.HOURLY,
            daily: limits.DAILY,
            monthly: limits.MONTHLY,
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

    // Scan all URLs with concurrency control
    const limit = pLimit(RATE_LIMITS.MAX_CONCURRENT_SCANS);
    
    const scanPromises = urls.map((urlData: any) => 
      limit(async () => {
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
    })
    );

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
