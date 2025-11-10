import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Log from "@/lib/models/Log";

/**
 * GET /api/user/settings
 * Get user settings/preferences
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to view settings",
        },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get user with settings
    const user = await User.findOne({ email: session.user.email }).lean();

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
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          settings,
          isPremium: user.isPremium || false,
        },
        message: "Settings retrieved successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An error occurred while retrieving settings",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/settings
 * Update user settings/preferences
 */
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to update settings",
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
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          message: "Settings object is required",
        },
        { status: 400 }
      );
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
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request",
            message: "confidenceThreshold must be between 0 and 1",
          },
          { status: 400 }
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

    return NextResponse.json(
      {
        success: true,
        data: {
          settings: updatedSettings,
        },
        message: "Settings updated successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An error occurred while updating settings",
      },
      { status: 500 }
    );
  }
}
