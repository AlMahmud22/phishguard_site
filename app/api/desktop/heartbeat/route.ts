import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Session from "@/lib/models/Session";
import { checkRateLimit } from "@/lib/rateLimit";
import os from "os";

export interface HeartbeatRequest {
  deviceInfo: {
    platform: string;
    appVersion: string;
    osVersion: string;
    hostname: string;
    electronVersion?: string;
  };
  desktopKeyId?: string;
}

/// POST /api/desktop/heartbeat
/// Desktop app sends heartbeat to maintain active session
/// Called every 30 seconds by desktop app
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limit: 150 requests per hour (every 30 seconds = 120/hour + buffer)
    const rateLimit = await checkRateLimit(session.user.id, {
      endpoint: "/api/desktop/heartbeat",
      limit: 150,
      windowMs: 3600000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    await connectToDatabase();

    const body: HeartbeatRequest = await request.json();
    const { deviceInfo, desktopKeyId } = body;

    // Validate device info
    if (!deviceInfo || !deviceInfo.platform || !deviceInfo.appVersion || !deviceInfo.hostname) {
      return NextResponse.json(
        { success: false, error: "Invalid device info" },
        { status: 400 }
      );
    }

    // Get client IP
    const ipAddress = 
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Find or create session
    // Use unique identifier: userId + hostname + platform
    const sessionIdentifier = {
      userId: session.user.id,
      "deviceInfo.hostname": deviceInfo.hostname,
      "deviceInfo.platform": deviceInfo.platform,
    };

    let desktopSession = await Session.findOne(sessionIdentifier);

    const now = new Date();

    if (desktopSession) {
      // Update existing session
      desktopSession.lastSeen = now;
      desktopSession.isActive = true;
      desktopSession.deviceInfo = deviceInfo;
      desktopSession.ipAddress = ipAddress;
      if (desktopKeyId) {
        desktopSession.desktopKeyId = desktopKeyId;
      }
      await desktopSession.save();
    } else {
      // Create new session
      desktopSession = await Session.create({
        userId: session.user.id,
        desktopKeyId,
        deviceInfo,
        ipAddress,
        lastSeen: now,
        isActive: true,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId: desktopSession._id.toString(),
          acknowledged: true,
          serverTime: now.toISOString(),
        },
        message: "Heartbeat received",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Heartbeat error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process heartbeat",
      },
      { status: 500 }
    );
  }
}

/// GET /api/desktop/heartbeat
/// Get heartbeat status (for testing)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      message: "Heartbeat endpoint operational",
      info: "Use POST to send heartbeat signals",
    },
    { status: 200 }
  );
}
