import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Log from "@/lib/models/Log";

/**
 * POST /api/client/log
 * Upload diagnostic logs from desktop application
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to submit logs",
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
    const { logs, metadata } = body;

    if (!logs || !Array.isArray(logs)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          message: "Logs array is required",
        },
        { status: 400 }
      );
    }

    // Limit log batch size
    if (logs.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          message: "Maximum 100 log entries per request",
        },
        { status: 400 }
      );
    }

    // Process and save logs
    const logEntries = logs.map((logEntry: any) => ({
      userId: user._id,
      action: "client_log",
      details: {
        level: logEntry.level || "info",
        message: logEntry.message,
        context: logEntry.context,
        timestamp: logEntry.timestamp ? new Date(logEntry.timestamp) : new Date(),
        metadata: {
          ...metadata,
          clientVersion: metadata?.clientVersion || "unknown",
          platform: metadata?.platform || "unknown",
          os: metadata?.os || "unknown",
        },
        error: logEntry.error,
        stack: logEntry.stack,
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      timestamp: new Date(),
    }));

    // Batch insert logs
    await Log.insertMany(logEntries);

    // Check for critical errors and create summary log
    const criticalCount = logs.filter((log: any) => log.level === "error" || log.level === "critical").length;
    
    if (criticalCount > 0) {
      await Log.create({
        userId: user._id,
        action: "client_logs_uploaded",
        details: {
          totalLogs: logs.length,
          criticalErrors: criticalCount,
          metadata,
        },
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        timestamp: new Date(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          logsReceived: logs.length,
          criticalErrors: criticalCount,
        },
        message: "Logs uploaded successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Client log upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An error occurred while uploading logs",
      },
      { status: 500 }
    );
  }
}
