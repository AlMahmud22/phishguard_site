import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateOneTimeCode, getStoreSize } from "@/lib/oneTimeCode";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

/**
 * GET /api/auth/test-code
 * Generate a test code for the currently logged-in user
 * This is for debugging only
 */
export async function GET(req: NextRequest) {
  try {
    // Check if user is logged in
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: "You must be logged in to generate a test code",
      }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found in database",
      }, { status: 404 });
    }

    // Generate one-time authorization code
    const code = generateOneTimeCode(
      String(user._id),
      user.email,
      user.role
    );

    console.log(`[Test Code] Generated code for ${user.email}: ${code.substring(0, 8)}...`);

    return NextResponse.json({
      success: true,
      code,
      email: user.email,
      storeSize: getStoreSize(),
      message: "Code generated successfully. Use it within 5 minutes.",
    });
  } catch (error: any) {
    console.error('[Test Code] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
