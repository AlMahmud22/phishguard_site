export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authMiddleware";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Log from "@/lib/models/Log";
import { createSuccessResponse, ErrorResponses } from "@/lib/apiResponse";
import bcrypt from "bcryptjs";

/**
 * GET /api/user/profile
 * Get authenticated user's profile information
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await dbConnect();

    const user = await User.findById(authUser.id).lean();

    if (!user) {
      return ErrorResponses.notFound("User not found");
    }

    // Return comprehensive profile data
    return createSuccessResponse(
      {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium || false,
        emailVerified: user.emailVerified,
        provider: user.provider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scanQuota: {
          hourly: user.scanQuota?.hourly || 0,
          daily: user.scanQuota?.daily || 0,
          monthly: user.scanQuota?.monthly || 0,
          lastReset: user.scanQuota?.lastReset,
        },
        settings: user.settings || {
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
        },
      },
      "Profile retrieved successfully"
    );
  } catch (error: any) {
    console.error("Get profile error:", error);
    
    if (error.status === 401) {
      return ErrorResponses.unauthorized(error.message);
    }
    
    return ErrorResponses.internalError(
      "An error occurred while retrieving profile"
    );
  }
}

/**
 * PUT /api/user/profile
 * Update authenticated user's profile information
 */
export async function PUT(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await dbConnect();

    const user = await User.findById(authUser.id);

    if (!user) {
      return ErrorResponses.notFound("User not found");
    }

    // Parse request body
    const body = await req.json();
    const { name, email } = body;

    // Validate input
    if (!name && !email) {
      return ErrorResponses.invalidRequest(
        "At least one field (name or email) is required"
      );
    }

    // Update name if provided
    if (name) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return ErrorResponses.invalidRequest(
          "Name must be at least 2 characters long"
        );
      }
      user.name = name.trim();
    }

    // Update email if provided (requires re-verification)
    if (email && email !== user.email) {
      if (typeof email !== "string" || !email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
        return ErrorResponses.invalidRequest("Invalid email format");
      }

      // Check if email is already taken
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return ErrorResponses.invalidRequest(
          "This email is already registered to another account"
        );
      }

      // For credentials-based accounts, require email re-verification
      if (user.provider === "credentials") {
        user.email = email.toLowerCase();
        user.emailVerified = false;
        
        // TODO: Send verification email
        // await sendVerificationEmail(user.email, user.name, verificationToken);
      } else {
        // For OAuth accounts, allow direct email change
        user.email = email.toLowerCase();
      }
    }

    // Save updated user
    await user.save();

    // Log the profile update
    await Log.create({
      userId: user._id,
      action: "profile_updated",
      details: {
        email: user.email,
        fieldsUpdated: {
          name: !!name,
          email: !!email,
        },
        userAgent: req.headers.get("user-agent") || "unknown",
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      timestamp: new Date(),
    });

    // Return updated profile
    return createSuccessResponse(
      {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium || false,
        emailVerified: user.emailVerified,
        provider: user.provider,
        updatedAt: user.updatedAt,
      },
      email && email !== authUser.email
        ? "Profile updated. Please verify your new email address."
        : "Profile updated successfully"
    );
  } catch (error: any) {
    console.error("Update profile error:", error);
    
    if (error.status === 401) {
      return ErrorResponses.unauthorized(error.message);
    }
    
    return ErrorResponses.internalError(
      "An error occurred while updating profile"
    );
  }
}
