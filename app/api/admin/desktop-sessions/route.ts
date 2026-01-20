import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Session from "@/lib/models/Session";
import User from "@/lib/models/User";
import { checkRateLimit } from "@/lib/rateLimit";

export interface DesktopSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  deviceInfo: {
    platform: string;
    appVersion: string;
    osVersion: string;
    hostname: string;
    electronVersion?: string;
  };
  ipAddress?: string;
  lastSeen: Date;
  isActive: boolean;
  duration: string;
  createdAt: Date;
}

export interface SessionsResponse {
  sessions: DesktopSession[];
  total: number;
  activeSessions: number;
  totalUsers: number;
}

/// GET /api/admin/desktop-sessions - Fetch all desktop app sessions
/// Requires admin or tester role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check role permission (admin or tester)
    if (!hasAnyRole(session, ["admin", "tester"])) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Requires admin or tester role" },
        { status: 403 }
      );
    }

    // Rate limit check
    const rateLimit = await checkRateLimit(session.user.id, {
      endpoint: "/api/admin/desktop-sessions",
      limit: 100,
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

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    // Build filter
    const filter: any = {};
    if (activeOnly) {
      filter.isActive = true;
    }

    // Fetch sessions
    const sessions = await Session.find(filter)
      .sort({ lastSeen: -1 })
      .limit(100)
      .lean();

    // Get user info for each session
    const userIds = [...new Set(sessions.map((s: any) => s.userId))];
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id name email")
      .lean();

    const userMap = new Map(
      users.map((u: any) => [u._id.toString(), { name: u.name, email: u.email }])
    );

    // Calculate duration helper
    const calculateDuration = (createdAt: Date, lastSeen: Date) => {
      const durationMs = lastSeen.getTime() - new Date(createdAt).getTime();
      const minutes = Math.floor(durationMs / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ${hours % 24}h`;
      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      return `${minutes}m`;
    };

    // Transform sessions
    const desktopSessions: DesktopSession[] = sessions.map((s: any) => {
      const userInfo = userMap.get(s.userId) || { name: "Unknown", email: "Unknown" };
      return {
        id: s._id.toString(),
        userId: s.userId,
        userName: userInfo.name,
        userEmail: userInfo.email,
        deviceInfo: s.deviceInfo,
        ipAddress: s.ipAddress,
        lastSeen: s.lastSeen,
        isActive: s.isActive,
        duration: calculateDuration(s.createdAt, s.lastSeen),
        createdAt: s.createdAt,
      };
    });

    // Count active sessions
    const activeSessions = await Session.countDocuments({ isActive: true });
    const totalUsers = userIds.length;

    const response: SessionsResponse = {
      sessions: desktopSessions,
      total: sessions.length,
      activeSessions,
      totalUsers,
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: `Retrieved ${sessions.length} sessions`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching desktop sessions:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch sessions",
      },
      { status: 500 }
    );
  }
}

/// DELETE /api/admin/desktop-sessions/:id
/// Deactivate a specific session (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!hasAnyRole(session, ["admin"])) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Requires admin role" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID required" },
        { status: 400 }
      );
    }

    const desktopSession = await Session.findById(sessionId);

    if (!desktopSession) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    desktopSession.isActive = false;
    await desktopSession.save();

    return NextResponse.json(
      {
        success: true,
        message: "Session deactivated",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deactivating session:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to deactivate session",
      },
      { status: 500 }
    );
  }
}
