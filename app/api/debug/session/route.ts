import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

/**
 * GET /api/debug/session
 * Debug endpoint to check session and database user info
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Fetch user from database by email
    const dbUser = await User.findOne({ email: session.user.email }).select(
      "name email role provider linkedAccounts"
    );

    return NextResponse.json({
      session: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
      database: dbUser ? {
        id: dbUser._id.toString(),
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        provider: dbUser.provider,
        linkedAccounts: dbUser.linkedAccounts,
      } : null,
      match: dbUser?.role === session.user.role,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
