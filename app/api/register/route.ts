import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import { logInfo, logError, logWarning, getClientIp, getUserAgent } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ipAddress = getClientIp(request.headers);
  const userAgent = getUserAgent(request.headers);

  try {
    const { name, email, password } = await request.json();

    // rate limit check - 5 registration attempts per hour per IP
    const rateLimitKey = `register:${ipAddress}`;
    const rateLimit = await checkRateLimit(rateLimitKey, {
      endpoint: "/api/register",
      limit: 5,
      windowMs: 3600000, // 1 hour
    });

    if (!rateLimit.allowed) {
      await logWarning(
        "Registration Rate Limit",
        "Too many registration attempts",
        { ipAddress, userAgent, metadata: { resetAt: rateLimit.resetAt } }
      );
      return NextResponse.json(
        { 
          success: false, 
          message: `Too many registration attempts. Please try again at ${rateLimit.resetAt.toLocaleTimeString()}`,
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    if (!name || !email || !password) {
      await logWarning(
        "Registration Failed",
        "Missing required fields",
        { ipAddress, userAgent, metadata: { email } }
      );
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      await logWarning(
        "Registration Failed",
        "Password too short",
        { ipAddress, userAgent, metadata: { email } }
      );
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      await logWarning(
        "Registration Failed",
        "Email already registered",
        { ipAddress, userAgent, metadata: { email } }
      );
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      provider: "credentials",
      role: "user",
    });

    const userId = (user._id as any).toString();

    await logInfo(
      "User Registration",
      `New user registered: ${email}`,
      {
        userId,
        userName: name,
        ipAddress,
        userAgent,
        metadata: { email, provider: "credentials" },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    await logError(
      "Registration Error",
      `Failed to create account: ${error.message}`,
      { ipAddress, userAgent }
    );
    return NextResponse.json(
      { success: false, message: "Failed to create account" },
      { status: 500 }
    );
  }
}
