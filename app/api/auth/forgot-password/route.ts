export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import { logInfo, logWarning, getClientIp, getUserAgent } from "@/lib/logger";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateSecureToken } from "@/lib/passwordValidation";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ipAddress = getClientIp(request.headers);
  const userAgent = getUserAgent(request.headers);

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Rate limit - 3 attempts per hour per IP
    const rateLimitKey = `forgot-password:${ipAddress}`;
    const rateLimit = await checkRateLimit(rateLimitKey, {
      endpoint: "/api/auth/forgot-password",
      limit: 3,
      windowMs: 3600000, // 1 hour
    });

    if (!rateLimit.allowed) {
      await logWarning(
        "Forgot Password Rate Limit",
        "Too many reset attempts",
        { ipAddress, userAgent, metadata: { email, resetAt: rateLimit.resetAt } }
      );
      return NextResponse.json(
        { 
          success: false, 
          message: `Too many reset attempts. Please try again at ${rateLimit.resetAt.toLocaleTimeString()}`,
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({
      email: email.toLowerCase(),
      provider: "credentials", // Only for users with password
    });

    // Always return success to prevent email enumeration
    const successMessage = "If an account exists with this email, you will receive a password reset link shortly.";

    if (!user) {
      await logWarning(
        "Password Reset Requested",
        "User not found or OAuth account",
        { ipAddress, userAgent, metadata: { email } }
      );
      
      // Still return success to prevent enumeration
      return NextResponse.json(
        { success: true, message: successMessage },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = generateSecureToken(32);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send reset email
    const emailSent = await sendPasswordResetEmail(user.email, user.name, resetToken);

    await logInfo(
      "Password Reset Requested",
      `Password reset email sent to: ${user.email}`,
      {
        userId: (user._id as any).toString(),
        ipAddress,
        userAgent,
        metadata: { email: user.email, emailSent },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: successMessage,
        emailSent,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
