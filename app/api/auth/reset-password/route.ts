export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import { logInfo, logWarning, getClientIp, getUserAgent } from "@/lib/logger";
import { validatePassword } from "@/lib/passwordValidation";
import { sendAccountUpdateEmail } from "@/lib/email";

export async function POST(request: Request) {
  const ipAddress = getClientIp(request.headers);
  const userAgent = getUserAgent(request.headers);

  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate new password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Password doesn't meet security requirements",
          errors: passwordValidation.feedback
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
      provider: "credentials",
    });

    if (!user) {
      await logWarning(
        "Password Reset Failed",
        "Invalid or expired token",
        { ipAddress, userAgent, metadata: { token } }
      );
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send notification email
    await sendAccountUpdateEmail(user.email, user.name, "Password Reset");

    await logInfo(
      "Password Reset",
      `Password reset successful for: ${user.email}`,
      {
        userId: (user._id as any).toString(),
        userName: user.name,
        ipAddress,
        userAgent,
        metadata: { email: user.email },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully! You can now login with your new password.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset password" },
      { status: 500 }
    );
  }
}
