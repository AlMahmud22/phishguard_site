export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OneTimeCode from "@/lib/models/OneTimeCode";

/**
 * GET /api/auth/debug-codes
 * Show all codes in the database (for debugging)
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const codes = await OneTimeCode.find().select('code email createdAt expiresAt consumed').sort({ createdAt: -1 }).limit(10);
    const totalCodes = await OneTimeCode.countDocuments();
    
    return NextResponse.json({
      success: true,
      totalCodes,
      recentCodes: codes.map(c => ({
        code: c.code.substring(0, 16) + '...',
        email: c.email,
        createdAt: c.createdAt,
        expiresAt: c.expiresAt,
        consumed: c.consumed,
        ageSeconds: Math.floor((Date.now() - c.createdAt.getTime()) / 1000),
        expiresInSeconds: Math.floor((c.expiresAt.getTime() - Date.now()) / 1000),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
