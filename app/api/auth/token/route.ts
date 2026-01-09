import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateTokenPair } from "@/lib/jwt";
import { createSuccessResponse, ErrorResponses } from "@/lib/apiResponse";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Log from "@/lib/models/Log";
import { validateAndConsumeCode } from "@/lib/oneTimeCode";
import { corsMiddleware, handleCorsOptions } from "@/lib/cors";

/// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

/**
 * POST /api/auth/token
 * Exchange NextAuth session OR one-time code for JWT tokens (for desktop client)
 * 
 * Two modes:
 * 1. Session mode: User has active NextAuth session (legacy)
 * 2. Code mode: User provides one-time code from desktop OAuth flow
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { code } = body;

    let user;
    let authMethod: string;

    // Mode 1: One-time code exchange (desktop OAuth flow)
    if (code) {
      console.log(`[Token] Code exchange requested: ${code.substring(0, 8)}...`);
      
      const codeData = await validateAndConsumeCode(code);
      
      if (!codeData) {
        return ErrorResponses.unauthorized(
          "Invalid or expired authorization code"
        );
      }

      await dbConnect();

      // Get user from database
      user = await User.findById(codeData.userId);

      if (!user) {
        return ErrorResponses.notFound("User account not found");
      }

      authMethod = "desktop_oauth_code";
      console.log(`[Token] Code validated for user: ${user.email}`);
    }
    // Mode 2: Session-based token exchange (legacy)
    else {
      // Verify NextAuth session
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user?.email) {
        return ErrorResponses.unauthorized(
          "You must be logged in or provide a valid code"
        );
      }

      await dbConnect();

      // Get user from database
      user = await User.findOne({ email: session.user.email });

      if (!user) {
        return ErrorResponses.notFound("User account not found");
      }

      authMethod = "session_exchange";
    }

    // Generate JWT token pair
    const tokens = generateTokenPair(
      String(user._id),
      user.email,
      user.role
    );

    // Log the token generation
    await Log.create({
      userId: user._id,
      action: "jwt_token_generated",
      details: JSON.stringify({
        email: user.email,
        userAgent: req.headers.get("user-agent") || "unknown",
        purpose: "desktop_client",
        method: authMethod,
      }),
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      timestamp: new Date(),
    });

    // Return tokens with CORS headers
    const response = createSuccessResponse(
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: "Bearer",
        expiresIn: tokens.expiresIn,
        refreshExpiresIn: tokens.refreshExpiresIn,
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
          isPremium: user.isPremium || false,
        },
      },
      "Tokens generated successfully"
    );
    // Add CORS headers
    const origin = req.headers.get("origin");
    if (origin && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
  } catch (error: any) {
    console.error("Token generation error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Return error with CORS headers
    const errorResponse = ErrorResponses.internalError(
      "An error occurred while generating tokens"
    );
    
    const origin = req.headers.get("origin");
    if (origin && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
      errorResponse.headers.set("Access-Control-Allow-Origin", origin);
      errorResponse.headers.set("Access-Control-Allow-Credentials", "true");
    }
    
    return errorResponse;
  }
}
