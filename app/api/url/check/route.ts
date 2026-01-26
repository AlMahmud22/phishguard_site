import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Scan from "@/lib/models/Scan";
import User from "@/lib/models/User";
import Log from "@/lib/models/Log";
import { scanUrl } from "@/lib/scanner";
import { nanoid } from "nanoid";
import { authenticateRequest } from "@/lib/authMiddleware";
import { ErrorResponses } from "@/lib/apiResponse";

/**
 * POST /api/url/check
 * Scan a single URL for phishing and malware
 * Supports both JWT authentication (desktop) and NextAuth session (web)
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate request (supports both JWT and NextAuth session)
    const { user: authUser, error: authError } = await authenticateRequest(req);
    
    if (!authUser) {
      return ErrorResponses.unauthorized(
        "You must be logged in to scan URLs"
      );
    }

    await dbConnect();

    // User is already fetched by authenticateRequest
    const user = authUser.user;

    // Parse request body
    const body = await req.json();
    const { url, localResult, context, userAgent } = body;
    
    // Extract local score from full Engine 1 result (new) or legacy format (backward compat)
    const localScore = localResult?.score || (body.localScore !== undefined ? body.localScore : undefined);
    const localFactors = localResult?.factors || body.localFactors || [];

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          message: "URL is required and must be a string",
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

    // Rate limits: Free = 100/hour, 500/day, 5000/month | Premium = 1000/hour, 10000/day, 100000/month
    const limits = user.isPremium
      ? { hourly: 1000, daily: 10000, monthly: 100000 }
      : { hourly: 100, daily: 500, monthly: 5000 };

    if (hourlyCount >= limits.hourly) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: `Hourly scan limit reached (${limits.hourly} scans/hour)`,
          limits: {
            hourly: limits.hourly,
            daily: limits.daily,
            monthly: limits.monthly,
            current: {
              hourly: hourlyCount,
              daily: dailyCount,
              monthly: monthlyCount,
            },
          },
        },
        { status: 429 }
      );
    }

    if (dailyCount >= limits.daily) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: `Daily scan limit reached (${limits.daily} scans/day)`,
          limits: {
            hourly: limits.hourly,
            daily: limits.daily,
            monthly: limits.monthly,
            current: {
              hourly: hourlyCount,
              daily: dailyCount,
              monthly: monthlyCount,
            },
          },
        },
        { status: 429 }
      );
    }

    if (monthlyCount >= limits.monthly) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: `Monthly scan limit reached (${limits.monthly} scans/month)`,
          limits: {
            hourly: limits.hourly,
            daily: limits.daily,
            monthly: limits.monthly,
            current: {
              hourly: hourlyCount,
              daily: dailyCount,
              monthly: monthlyCount,
            },
          },
        },
        { status: 429 }
      );
    }

    // Perform the scan
    let scanResult;
    try {
      console.log(`[API /url/check] Starting scan for URL: ${url}`);
      console.log(`[API /url/check] Local score: ${localScore}, Context: ${context}`);
      scanResult = await scanUrl(url, localScore, localFactors, localResult);
      console.log(`[API /url/check] Scan completed successfully:`, {
        status: scanResult.status,
        score: scanResult.score,
        enginesUsed: scanResult.scoring?.enginesUsed
      });
    } catch (error: any) {
      console.error(`[API /url/check] Scan failed for ${url}:`, error);
      console.error(`[API /url/check] Error stack:`, error.stack);
      
      await Log.create({
        userId: user._id,
        action: "url_scan_failed",
        details: `Scan failed for ${url}: ${error.message}`,
        metadata: {
          url: url,
          error: error.message,
          errorStack: error.stack,
          userAgent: userAgent || 'Unknown',
        },
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        timestamp: new Date(),
      });

      return NextResponse.json(
        {
          success: false,
          error: "Scan failed",
          message: error.message || "Failed to scan URL",
        },
        { status: 400 }
      );
    }

    // Generate scan ID
    const scanId = `scn_${Date.now()}_${nanoid(10)}`;
    const timestamp = new Date();
    const processingTime = Date.now() - startTime;

    // Save scan to database
    const scan = await Scan.create({
      userId: user._id,
      scanId,
      url,
      status: scanResult.status,
      score: scanResult.score,
      confidence: scanResult.confidence,
      verdict: scanResult.verdict,
      analysis: scanResult.analysis,
      engines: scanResult.engines,
      scoring: scanResult.scoring,
      factors: scanResult.factors,
      recommendation: scanResult.recommendation,
      localScore,
      localFactors,
      context,
      synced: true,
      timestamp,
      processingTime,
    });

    // Log the action
    await Log.create({
      userId: user._id,
      action: "url_scan",
      details: `Scanned ${url} - Status: ${scanResult.status}, Score: ${scanResult.score}%`,
      metadata: {
        scanId: scanId,
        url: url,
        status: scanResult.status,
        score: scanResult.score,
        context: context || 'manual',
        userAgent: userAgent || 'Unknown',
        enginesUsed: scanResult.scoring?.enginesUsed || []
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      timestamp: new Date(),
    });

    // Update user scan quota
    await User.updateOne(
      { _id: user._id },
      {
        $inc: {
          "scanQuota.hourly": 1,
          "scanQuota.daily": 1,
          "scanQuota.monthly": 1,
        },
        $set: {
          "scanQuota.lastReset": now,
        },
      }
    );

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          scanId,
          url,
          status: scanResult.status,
          score: scanResult.score,
          confidence: scanResult.confidence,
          partial: scanResult.partial || false,
          verdict: scanResult.verdict,
          analysis: scanResult.analysis,
          engines: scanResult.engines,
          scoring: scanResult.scoring,
          factors: scanResult.factors,
          recommendation: scanResult.recommendation,
          timestamp: timestamp.toISOString(),
          processingTime,
        },
        message: "URL scan completed successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("URL scan error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An error occurred while scanning the URL",
      },
      { status: 500 }
    );
  }
}
