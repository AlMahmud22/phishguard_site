import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { logInfo, logError, logWarning, getClientIp, getUserAgent } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rateLimit";
import { validatePassword, generateSecureToken } from "@/lib/passwordValidation";
import { sendVerificationEmail } from "@/lib/email";
import { createSuccessResponse, ErrorResponses } from "@/lib/apiResponse";
import { handleCorsOptions } from "@/lib/cors";

/// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

/**
 * POST /api/auth/desktop-register
 * Desktop-specific registration endpoint
 * Similar to /api/register but optimized for desktop client
 */
export async function POST(req: NextRequest) {
  const ipAddress = getClientIp(req.headers);
  const userAgent = getUserAgent(req.headers);

  try {
    const { name, email, password } = await req.json();

    // Rate limit check - 5 registration attempts per hour per IP
    const rateLimitKey = `register:desktop:${ipAddress}`;
    const rateLimit = await checkRateLimit(rateLimitKey, {
      endpoint: "/api/auth/desktop-register",
      limit: 5,
      windowMs: 3600000, // 1 hour
    });

    if (!rateLimit.allowed) {
      await logWarning(
        "Desktop Registration Rate Limit",
        "Too many registration attempts",
        { ipAddress, userAgent, metadata: { resetAt: rateLimit.resetAt } }
      );
      
      return NextResponse.json(
        {
          success: false,
          error: "RATE_LIMIT_EXCEEDED",
          message: `Too many registration attempts. Please try again at ${rateLimit.resetAt.toLocaleTimeString()}`,
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    // Validate required fields
    if (!name || !email || !password) {
      await logWarning(
        "Desktop Registration Failed",
        "Missing required fields",
        { ipAddress, userAgent, metadata: { email } }
      );
      
      return ErrorResponses.invalidRequest("All fields (name, email, password) are required");
    }

    // Validate name
    if (name.trim().length < 2) {
      return ErrorResponses.invalidRequest("Name must be at least 2 characters long");
    }

    if (name.trim().length > 100) {
      return ErrorResponses.invalidRequest("Name cannot exceed 100 characters");
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return ErrorResponses.invalidRequest("Invalid email format");
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      await logWarning(
        "Desktop Registration Failed",
        "Weak password",
        { ipAddress, userAgent, metadata: { email, feedback: passwordValidation.feedback } }
      );
      
      return NextResponse.json(
        {
          success: false,
          error: "WEAK_PASSWORD",
          message: "Password doesn't meet security requirements",
          errors: passwordValidation.feedback,
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if email exists with ANY provider
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      const providerMessage = existingUser.provider === 'credentials'
        ? 'with email and password'
        : `with ${existingUser.provider}`;

      await logWarning(
        "Desktop Registration Failed",
        "Email already registered",
        { ipAddress, userAgent, metadata: { email, existingProvider: existingUser.provider } }
      );
      
      return NextResponse.json(
        {
          success: false,
          error: "EMAIL_EXISTS",
          message: `This email is already registered ${providerMessage}. Please login instead.`,
          existingProvider: existingUser.provider,
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = generateSecureToken(32);
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      provider: "credentials",
      role: "user",
      emailVerified: false,
      verificationToken,
      verificationTokenExpires,
    });

    const userId = String(user._id);

    // Send verification email
    let emailSent = false;
    try {
      emailSent = await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue anyway - user is created
    }

    // Log successful registration
    await logInfo(
      "Desktop User Registration",
      `New user registered from desktop: ${email}`,
      {
        userId,
        userName: name,
        ipAddress,
        userAgent,
        metadata: { email, provider: "credentials", emailSent },
      }
    );

    const response = createSuccessResponse(
      {
        requiresVerification: true,
        emailSent,
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      emailSent
        ? "Account created successfully! Please check your email to verify your account."
        : "Account created! Email verification is required, but the email service is currently unavailable.",
      201
    );

    // Add CORS headers for desktop app
    const origin = req.headers.get("origin");
    if (origin && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
  } catch (error: any) {
    console.error("Desktop registration error:", error);
    
    await logError(
      "Desktop Registration Error",
      `Failed to create account: ${error.message}`,
      { ipAddress, userAgent }
    );
    
    return ErrorResponses.internalError("Failed to create account. Please try again.");
  }
}
