import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import User from "@/lib/models/User";
import Session from "@/lib/models/Session";

export interface ConfigCheck {
  name: string;
  configured: boolean;
  value?: string;
  status: "valid" | "missing" | "invalid";
}

export interface ApiEndpointStatus {
  name: string;
  endpoint: string;
  status: "operational" | "degraded" | "down" | "unknown";
  responseTime?: number;
  lastChecked: Date;
  message?: string;
  details?: Record<string, any>;
}

export interface ApiStatusResponse {
  overall: "operational" | "degraded" | "down";
  services: {
    core: ApiEndpointStatus[];
    external: ApiEndpointStatus[];
    authentication: ApiEndpointStatus[];
  };
  configuration: {
    database: ConfigCheck[];
    email: ConfigCheck[];
    oauth: ConfigCheck[];
    externalApis: ConfigCheck[];
    jwt: ConfigCheck[];
  };
  statistics: {
    totalUsers: number;
    activeDesktopKeys: number;
    totalScans: number;
    activeDesktopSessions: number;
  };
  uptime: {
    percentage: number;
    since: Date;
  };
  lastUpdate: Date;
}

async function checkMongoDBStatus(): Promise<ApiEndpointStatus> {
  const startTime = Date.now();
  try {
    const db = await connectToDatabase();
    const responseTime = Date.now() - startTime;
    
    // Perform a simple ping operation
    await db.connection.db?.admin().ping();

    return {
      name: "MongoDB",
      endpoint: "Database Connection",
      status: "operational",
      responseTime,
      lastChecked: new Date(),
      message: "Connected successfully",
      details: {
        database: process.env.MONGODB_DB || "PhishGuard",
        connectionState: db.connection.readyState === 1 ? "Connected" : "Disconnected",
      },
    };
  } catch (error: any) {
    return {
      name: "MongoDB",
      endpoint: "Database Connection",
      status: "down",
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      message: error.message || "Connection failed",
    };
  }
}

async function checkEmailService(): Promise<ApiEndpointStatus> {
  const hasEmailConfig = !!(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  );

  return {
    name: "Email Service",
    endpoint: "SMTP",
    status: hasEmailConfig ? "operational" : "degraded",
    lastChecked: new Date(),
    message: hasEmailConfig
      ? "Email service configured"
      : "Email service not configured",
    details: {
      host: process.env.EMAIL_HOST || "Not configured",
      port: process.env.EMAIL_PORT || "Not configured",
      from: process.env.EMAIL_FROM || "Not configured",
    },
  };
}

async function checkGoogleOAuth(): Promise<ApiEndpointStatus> {
  const hasGoogleConfig = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return {
    name: "Google OAuth",
    endpoint: "Authentication",
    status: hasGoogleConfig ? "operational" : "degraded",
    lastChecked: new Date(),
    message: hasGoogleConfig
      ? "Google OAuth configured"
      : "Google OAuth not configured",
    details: {
      clientId: process.env.GOOGLE_CLIENT_ID
        ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`
        : "Not configured",
    },
  };
}

async function checkGitHubOAuth(): Promise<ApiEndpointStatus> {
  const hasGitHubConfig = !!(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
  );

  return {
    name: "GitHub OAuth",
    endpoint: "Authentication",
    status: hasGitHubConfig ? "operational" : "degraded",
    lastChecked: new Date(),
    message: hasGitHubConfig
      ? "GitHub OAuth configured"
      : "GitHub OAuth not configured",
    details: {
      clientId: process.env.GITHUB_CLIENT_ID || "Not configured",
    },
  };
}

async function checkVirusTotal(): Promise<ApiEndpointStatus> {
  const hasVirusTotalKey = !!process.env.VIRUSTOTAL_API_KEY;

  if (!hasVirusTotalKey) {
    return {
      name: "VirusTotal",
      endpoint: "External API",
      status: "degraded",
      lastChecked: new Date(),
      message: "API key not configured",
    };
  }

  const startTime = Date.now();
  try {
    const response = await fetch("https://www.virustotal.com/api/v3/urls", {
      method: "HEAD",
      headers: {
        "x-apikey": process.env.VIRUSTOTAL_API_KEY!,
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - startTime;

    return {
      name: "VirusTotal",
      endpoint: "External API",
      status: response.ok || response.status === 405 ? "operational" : "degraded",
      responseTime,
      lastChecked: new Date(),
      message: response.ok || response.status === 405 ? "API responding" : `HTTP ${response.status}`,
    };
  } catch (error: any) {
    return {
      name: "VirusTotal",
      endpoint: "External API",
      status: "down",
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      message: error.message || "Request failed",
    };
  }
}

async function checkUrlScan(): Promise<ApiEndpointStatus> {
  const hasUrlScanKey = !!process.env.URLSCAN_API_KEY;

  if (!hasUrlScanKey) {
    return {
      name: "URLScan.io",
      endpoint: "External API",
      status: "degraded",
      lastChecked: new Date(),
      message: "API key not configured",
    };
  }

  const startTime = Date.now();
  try {
    const response = await fetch("https://urlscan.io/api/v1/", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - startTime;

    return {
      name: "URLScan.io",
      endpoint: "External API",
      status: response.ok ? "operational" : "degraded",
      responseTime,
      lastChecked: new Date(),
      message: response.ok ? "API responding" : `HTTP ${response.status}`,
    };
  } catch (error: any) {
    return {
      name: "URLScan.io",
      endpoint: "External API",
      status: "down",
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      message: error.message || "Request failed",
    };
  }
}

async function checkGoogleSafeBrowsing(): Promise<ApiEndpointStatus> {
  const hasGoogleKey = !!process.env.GOOGLE_SAFE_BROWSING_KEY;

  if (!hasGoogleKey) {
    return {
      name: "Google Safe Browsing",
      endpoint: "External API",
      status: "degraded",
      lastChecked: new Date(),
      message: "API key not configured",
    };
  }

  return {
    name: "Google Safe Browsing",
    endpoint: "External API",
    status: "operational",
    lastChecked: new Date(),
    message: "API key configured",
  };
}

function checkConfiguration() {
  const database: ConfigCheck[] = [
    {
      name: "MongoDB URI",
      configured: !!process.env.MONGODB_URI,
      value: process.env.MONGODB_URI ? "mongodb://***" : undefined,
      status: process.env.MONGODB_URI ? "valid" : "missing",
    },
    {
      name: "Database Name",
      configured: !!process.env.MONGODB_DB,
      value: process.env.MONGODB_DB,
      status: process.env.MONGODB_DB ? "valid" : "missing",
    },
  ];

  const email: ConfigCheck[] = [
    {
      name: "SMTP Host",
      configured: !!process.env.EMAIL_HOST,
      value: process.env.EMAIL_HOST,
      status: process.env.EMAIL_HOST ? "valid" : "missing",
    },
    {
      name: "SMTP Port",
      configured: !!process.env.EMAIL_PORT,
      value: process.env.EMAIL_PORT,
      status: process.env.EMAIL_PORT ? "valid" : "missing",
    },
    {
      name: "Email User",
      configured: !!process.env.EMAIL_USER,
      value: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 5)}***` : undefined,
      status: process.env.EMAIL_USER ? "valid" : "missing",
    },
    {
      name: "Email Password",
      configured: !!process.env.EMAIL_PASS,
      value: process.env.EMAIL_PASS ? "***" : undefined,
      status: process.env.EMAIL_PASS ? "valid" : "missing",
    },
  ];

  const oauth: ConfigCheck[] = [
    {
      name: "Google Client ID",
      configured: !!process.env.GOOGLE_CLIENT_ID,
      value: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : undefined,
      status: process.env.GOOGLE_CLIENT_ID ? "valid" : "missing",
    },
    {
      name: "Google Client Secret",
      configured: !!process.env.GOOGLE_CLIENT_SECRET,
      value: process.env.GOOGLE_CLIENT_SECRET ? "***" : undefined,
      status: process.env.GOOGLE_CLIENT_SECRET ? "valid" : "missing",
    },
    {
      name: "GitHub Client ID",
      configured: !!process.env.GITHUB_CLIENT_ID,
      value: process.env.GITHUB_CLIENT_ID,
      status: process.env.GITHUB_CLIENT_ID ? "valid" : "missing",
    },
    {
      name: "GitHub Client Secret",
      configured: !!process.env.GITHUB_CLIENT_SECRET,
      value: process.env.GITHUB_CLIENT_SECRET ? "***" : undefined,
      status: process.env.GITHUB_CLIENT_SECRET ? "valid" : "missing",
    },
  ];

  const externalApis: ConfigCheck[] = [
    {
      name: "VirusTotal API Key",
      configured: !!process.env.VIRUSTOTAL_API_KEY,
      value: process.env.VIRUSTOTAL_API_KEY ? "***" : undefined,
      status: process.env.VIRUSTOTAL_API_KEY ? "valid" : "missing",
    },
    {
      name: "URLScan API Key",
      configured: !!process.env.URLSCAN_API_KEY,
      value: process.env.URLSCAN_API_KEY ? "***" : undefined,
      status: process.env.URLSCAN_API_KEY ? "valid" : "missing",
    },
    {
      name: "Google Safe Browsing Key",
      configured: !!process.env.GOOGLE_SAFE_BROWSING_KEY,
      value: process.env.GOOGLE_SAFE_BROWSING_KEY ? "***" : undefined,
      status: process.env.GOOGLE_SAFE_BROWSING_KEY ? "valid" : "missing",
    },
  ];

  const jwt: ConfigCheck[] = [
    {
      name: "NextAuth Secret",
      configured: !!process.env.NEXTAUTH_SECRET,
      value: process.env.NEXTAUTH_SECRET ? "***" : undefined,
      status: process.env.NEXTAUTH_SECRET ? "valid" : "missing",
    },
    {
      name: "JWT Secret",
      configured: !!process.env.JWT_SECRET,
      value: process.env.JWT_SECRET ? "***" : undefined,
      status: process.env.JWT_SECRET ? "valid" : "missing",
    },
    {
      name: "JWT Access Secret",
      configured: !!process.env.JWT_ACCESS_SECRET,
      value: process.env.JWT_ACCESS_SECRET ? "***" : undefined,
      status: process.env.JWT_ACCESS_SECRET ? "valid" : "missing",
    },
  ];

  return { database, email, oauth, externalApis, jwt };
}

async function getSystemStatistics() {
  try {
    await connectToDatabase();
    
    const totalUsers = await User.countDocuments();
    
    // Count active desktop keys
    const usersWithKeys = await User.find({ "desktopAppKeys.isActive": true });
    const activeDesktopKeys = usersWithKeys.reduce((count, user) => {
      return count + (user.desktopAppKeys?.filter((k: any) => k.isActive).length || 0);
    }, 0);

    // Count active desktop sessions
    const activeDesktopSessions = await Session.countDocuments({ isActive: true });

    // TODO: Add scan count from Scan model if it exists
    const totalScans = 0;

    return {
      totalUsers,
      activeDesktopKeys,
      totalScans,
      activeDesktopSessions,
    };
  } catch (error) {
    console.error("Error getting statistics:", error);
    return {
      totalUsers: 0,
      activeDesktopKeys: 0,
      totalScans: 0,
      activeDesktopSessions: 0,
    };
  }
}

/// GET /api/admin/api-status - Check status of all API endpoints
/// Requires admin or tester role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    /// check authentication
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

    /// rate limit check - 50 requests per hour per user
    const rateLimit = await checkRateLimit(session.user.id, {
      endpoint: "/api/admin/api-status",
      limit: 50,
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

    // Run all checks in parallel for faster response
    const [
      mongoStatus,
      emailStatus,
      googleOAuthStatus,
      githubOAuthStatus,
      virusTotalStatus,
      urlScanStatus,
      safeBrowsingStatus,
      statistics,
    ] = await Promise.all([
      checkMongoDBStatus(),
      checkEmailService(),
      checkGoogleOAuth(),
      checkGitHubOAuth(),
      checkVirusTotal(),
      checkUrlScan(),
      checkGoogleSafeBrowsing(),
      getSystemStatistics(),
    ]);

    const configuration = checkConfiguration();

    const coreServices = [mongoStatus, emailStatus];
    const authServices = [googleOAuthStatus, githubOAuthStatus];
    const externalServices = [virusTotalStatus, urlScanStatus, safeBrowsingStatus];

    // Calculate overall status
    const allServices = [...coreServices, ...authServices, ...externalServices];
    const downCount = allServices.filter((s) => s.status === "down").length;
    const degradedCount = allServices.filter((s) => s.status === "degraded").length;

    let overallStatus: "operational" | "degraded" | "down";
    if (downCount > 0) {
      overallStatus = "down";
    } else if (degradedCount > 0) {
      overallStatus = "degraded";
    } else {
      overallStatus = "operational";
    }

    const response: ApiStatusResponse = {
      overall: overallStatus,
      services: {
        core: coreServices,
        authentication: authServices,
        external: externalServices,
      },
      configuration,
      statistics,
      uptime: {
        percentage: 99.9, // TODO: Calculate actual uptime from logs
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
      lastUpdate: new Date(),
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: `API status: ${overallStatus}`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error checking API status:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check API status",
      },
      { status: 500 }
    );
  }
}
