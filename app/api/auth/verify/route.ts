export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import { logInfo, logWarning, getClientIp, getUserAgent } from "@/lib/logger";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: Request) {
  const ipAddress = getClientIp(request.headers);
  const userAgent = getUserAgent(request.headers);

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Verification token is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      await logWarning(
        "Email Verification Failed",
        "Invalid or expired token",
        { ipAddress, userAgent, metadata: { token } }
      );
      return NextResponse.json(
        { success: false, message: "Invalid or expired verification link" },
        { status: 400 }
      );
    }

    // Mark email as verified
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    await logInfo(
      "Email Verified",
      `User verified email: ${user.email}`,
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
        message: "Email verified successfully! You can now login.",
        verified: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify email" },
      { status: 500 }
    );
  }
}

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

    await connectToDatabase();

    const user = await User.findOne({
      email: email.toLowerCase(),
      provider: "credentials",
      emailVerified: false,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found or already verified" },
        { status: 400 }
      );
    }

    // Generate new token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Resend verification email
    const { sendVerificationEmail } = await import('@/lib/email');
    const emailSent = await sendVerificationEmail(user.email, user.name, verificationToken);

    await logInfo(
      "Verification Email Resent",
      `Resent verification email to: ${user.email}`,
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
        message: "Verification email sent! Please check your inbox.",
        emailSent,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
