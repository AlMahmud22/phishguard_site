import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateTokenPair } from "@/lib/jwt";
import { createSuccessResponse, ErrorResponses } from "@/lib/apiResponse";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Log from "@/lib/models/Log";

/**
 * POST /api/auth/token
 * Exchange NextAuth session for JWT tokens (for desktop client)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify NextAuth session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return ErrorResponses.unauthorized(
        "You must be logged in to get API tokens"
      );
    }

    await dbConnect();

    // Get user from database
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return ErrorResponses.notFound("User account not found");
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
      details: {
        email: user.email,
        userAgent: req.headers.get("user-agent") || "unknown",
        purpose: "desktop_client",
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      timestamp: new Date(),
    });

    // Return tokens
    return createSuccessResponse(
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
  } catch (error: any) {
    console.error("Token generation error:", error);
    return ErrorResponses.internalError(
      "An error occurred while generating tokens"
    );
  }
}
