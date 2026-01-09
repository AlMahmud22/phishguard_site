import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authMiddleware";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Log from "@/lib/models/Log";
import { createSuccessResponse, ErrorResponses } from "@/lib/apiResponse";

/**
 * GET /api/user/settings
 * Get user settings/preferences
 * Supports both NextAuth sessions and JWT tokens
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication (supports JWT and NextAuth)
    const authUser = await requireAuth(req);
    await dbConnect();

    // Get user with settings
    const user = await User.findById(authUser.id).lean();

    if (!user) {
      return ErrorResponses.notFound("User not found");
    }

    // Return settings with defaults if not set
    const settings = user.settings || {
      notifications: {
        email: true,
        desktop: true,
        weeklyReport: true,
      },
      scanning: {
        autoScan: false,
        clipboardMonitoring: false,
        confidenceThreshold: 0.7,
      },
      appearance: {
        darkMode: false,
        soundEffects: true,
      },
      privacy: {
        shareAnonymousData: true,
        improveModel: true,
      },
      monitoredApps: {
        universalMonitoring: false,
        applications: [],
      },
    };

    return createSuccessResponse(
      {
        settings,
        isPremium: user.isPremium || false,
      },
      "Settings retrieved successfully"
    );
  } catch (error: any) {
    console.error("Get settings error:", error);
    return ErrorResponses.internalError(
      "An error occurred while retrieving settings"
    );
  }
}

/**
 * PUT /api/user/settings
 * Update user settings/preferences
 * Supports both NextAuth sessions and JWT tokens
 */
export async function PUT(req: NextRequest) {
  try {
    // Check authentication (supports JWT and NextAuth)
    const authUser = await requireAuth(req);
    await dbConnect();

    // Get user
    const user = await User.findById(authUser.id);

    if (!user) {
      return ErrorResponses.notFound("User not found");
    }

    // Parse request body
    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return ErrorResponses.invalidRequest("Settings object is required");
    }

    // Validate and merge settings
    const updatedSettings: any = { ...user.settings };

    if (settings.notifications) {
      updatedSettings.notifications = {
        ...updatedSettings.notifications,
        ...settings.notifications,
      };
    }

    if (settings.scanning) {
      updatedSettings.scanning = {
        ...updatedSettings.scanning,
        ...settings.scanning,
      };

      // Validate confidenceThreshold
      if (
        settings.scanning.confidenceThreshold !== undefined &&
        (settings.scanning.confidenceThreshold < 0 ||
          settings.scanning.confidenceThreshold > 1)
      ) {
        return ErrorResponses.invalidRequest(
          "confidenceThreshold must be between 0 and 1"
        );
      }
    }

    if (settings.appearance) {
      updatedSettings.appearance = {
        ...updatedSettings.appearance,
        ...settings.appearance,
      };
    }

    if (settings.privacy) {
      updatedSettings.privacy = {
        ...updatedSettings.privacy,
        ...settings.privacy,
      };
    }

    if (settings.monitoredApps) {
      updatedSettings.monitoredApps = {
        universalMonitoring: settings.monitoredApps.universalMonitoring ?? updatedSettings.monitoredApps?.universalMonitoring ?? false,
        applications: settings.monitoredApps.applications || updatedSettings.monitoredApps?.applications || [],
      };

      // Validate monitored apps structure
      if (updatedSettings.monitoredApps.applications && Array.isArray(updatedSettings.monitoredApps.applications)) {
        for (const app of updatedSettings.monitoredApps.applications) {
          if (!app.id || !app.name || !app.category || typeof app.enabled !== 'boolean') {
            return ErrorResponses.invalidRequest("Invalid monitored application structure");
          }
        }
      }
    }

    // Update user settings
    user.settings = updatedSettings;
    await user.save();

    // Log the action
    await Log.create({
      userId: user._id,
      action: "settings_updated",
      details: {
        updatedFields: Object.keys(settings),
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      timestamp: new Date(),
    });

    return createSuccessResponse(
      {
        settings: updatedSettings,
      },
      "Settings updated successfully"
    );
  } catch (error: any) {
    console.error("Update settings error:", error);
    return ErrorResponses.internalError(
      "An error occurred while updating settings"
    );
  }
}
