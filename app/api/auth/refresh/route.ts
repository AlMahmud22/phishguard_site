import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, generateAccessToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Log from "@/lib/models/Log";

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get refresh token from body
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Refresh token is required",
          },
        },
        { status: 400 }
      );
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired refresh token",
          },
        },
        { status: 401 }
      );
    }

    // Verify user still exists and is active
    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not found",
          },
        },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(
      String(user._id),
      user.email,
      user.role
    );

    // Log the token refresh
    await Log.create({
      userId: user._id,
      action: "token_refresh",
      details: {
        email: user.email,
        userAgent: req.headers.get("user-agent") || "unknown",
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      timestamp: new Date(),
    });

    // Return new access token
    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken: newAccessToken,
          expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRY || "3600", 10),
          tokenType: "Bearer",
        },
        message: "Access token refreshed successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while refreshing token",
        },
      },
      { status: 500 }
    );
  }
}
