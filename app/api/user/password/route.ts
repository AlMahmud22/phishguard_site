export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authMiddleware";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Log from "@/lib/models/Log";
import { createSuccessResponse, ErrorResponses } from "@/lib/apiResponse";
import { validatePassword } from "@/lib/passwordValidation";
import bcrypt from "bcryptjs";

/**
 * PATCH /api/user/password
 * Change authenticated user's password
 */
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await dbConnect();

    const user = await User.findById(authUser.id);

    if (!user) {
      return ErrorResponses.notFound("User not found");
    }

    // Only allow password change for credentials-based accounts
    if (user.provider !== "credentials") {
      return ErrorResponses.invalidRequest(
        `Cannot change password for ${user.provider}-authenticated accounts. Please use ${user.provider} to manage your password.`
      );
    }

    // Parse request body
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return ErrorResponses.invalidRequest(
        "Both currentPassword and newPassword are required"
      );
    }

    // Verify current password
    if (!user.passwordHash) {
      return ErrorResponses.internalError(
        "Account password not found. Please contact support."
      );
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isValidPassword) {
      // Log failed attempt
      await Log.create({
        userId: user._id,
        action: "password_change_failed",
        details: {
          email: user.email,
          reason: "incorrect_current_password",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        timestamp: new Date(),
      });

      return ErrorResponses.unauthorized("Current password is incorrect");
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "WEAK_PASSWORD",
          message: "New password doesn't meet security requirements",
          errors: passwordValidation.feedback,
        },
        { status: 400 }
      );
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return ErrorResponses.invalidRequest(
        "New password must be different from current password"
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    user.passwordHash = newPasswordHash;
    await user.save();

    // Log successful password change
    await Log.create({
      userId: user._id,
      action: "password_changed",
      details: {
        email: user.email,
        userAgent: req.headers.get("user-agent") || "unknown",
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      timestamp: new Date(),
    });

    return createSuccessResponse(
      {
        success: true,
        changedAt: new Date().toISOString(),
      },
      "Password changed successfully"
    );
  } catch (error: any) {
    console.error("Change password error:", error);
    
    if (error.status === 401) {
      return ErrorResponses.unauthorized(error.message);
    }
    
    return ErrorResponses.internalError(
      "An error occurred while changing password"
    );
  }
}
