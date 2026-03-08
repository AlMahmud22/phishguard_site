export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { getCodeInfo, getStoreSize } from "@/lib/oneTimeCode";

/**
 * GET /api/auth/code-status?code=XXX
 * Check the status of a code without consuming it (for debugging)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({
        success: false,
        error: "Code parameter required",
        storeSize: await getStoreSize(),
      });
    }

    const info = await getCodeInfo(code);

    if (!info) {
      return NextResponse.json({
        success: false,
        found: false,
        storeSize: await getStoreSize(),
        message: "Code not found in store",
      });
    }

    const now = Date.now();
    const ageSeconds = Math.floor((now - info.createdAt.getTime()) / 1000);
    const expiresInSeconds = Math.floor((info.expiresAt.getTime() - now) / 1000);
    const isExpired = now > info.expiresAt.getTime();

    return NextResponse.json({
      success: true,
      found: true,
      code: code.substring(0, 8) + "...",
      email: info.email,
      ageSeconds,
      expiresInSeconds,
      isExpired,
      consumed: info.consumed,
      storeSize: await getStoreSize(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
