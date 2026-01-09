import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { createSuccessResponse, ErrorResponses } from "@/lib/apiResponse";

/**
 * GET /api/scanner/capabilities
 * Returns which scanning engines are available (without exposing API keys)
 * 
 * Desktop app uses this to know which engines can be used
 * API keys stay on backend - never exposed to client
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session || !session.user) {
      return ErrorResponses.unauthorized("Please log in to access scanner capabilities");
    }

    // Check which engines have API keys configured
    const capabilities = {
      engines: {
        engine1: true, // Core ML always available (client-side)
        google: !!process.env.GOOGLE_SAFE_BROWSING_API_KEY,
        phishtank: !!process.env.PHISHTANK_API_KEY,
        virustotal: !!process.env.VIRUSTOTAL_API_KEY,
        urlscan: !!process.env.URLSCAN_API_KEY,
      },
      features: {
        localAnalysis: true, // ENGINE 1 (Core ML)
        cloudAnalysis: true, // Backend scanning
        multiEngine: true, // Orchestrator with weighted voting
        rateLimiting: true,
        caching: true,
      },
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };

    return createSuccessResponse(capabilities);

  } catch (error) {
    console.error("[Scanner Capabilities] Error:", error);
    return ErrorResponses.internalError("Failed to get scanner capabilities");
  }
}
