import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

/**
 * POST /api/auth/refresh-session
 * Force refresh the user's session data from the database
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Fetch latest user data from database
    const dbUser = await User.findOne({ email: session.user.email });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Please log out and log back in to refresh your session",
      currentSessionRole: session.user.role,
      databaseRole: dbUser.role,
      needsRefresh: dbUser.role !== session.user.role,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
