import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/urlscan/status/[uuid]
 * Check URLScan.io scan status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    if (!uuid) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing UUID parameter",
        },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.URLSCAN_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "URLScan.io API not configured",
        },
        { status: 503 }
      );
    }

    // Fetch results from URLScan.io
    const response = await fetch(
      `https://urlscan.io/api/v1/result/${uuid}/`,
      {
        headers: {
          "API-Key": process.env.URLSCAN_API_KEY,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.status === 404) {
      // Still processing
      return NextResponse.json(
        {
          success: true,
          data: {
            status: "PROCESSING",
            message: "Scan still in progress",
            scanUrl: `https://urlscan.io/result/${uuid}/`,
          },
        },
        { status: 200 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch scan results",
          message: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const verdict = data.verdicts?.overall || {};

    // Return normalized result
    return NextResponse.json(
      {
        success: true,
        data: {
          status: verdict.malicious ? "MALICIOUS" : verdict.score > 0 ? "SUSPICIOUS" : "CLEAN",
          detected: verdict.malicious || false,
          score: verdict.score || 0,
          verdict: {
            malicious: verdict.malicious || false,
            score: verdict.score || 0,
            categories: verdict.categories || [],
            brands: verdict.brands || [],
          },
          page: {
            url: data.page?.url,
            domain: data.page?.domain,
            country: data.page?.country,
            ip: data.page?.ip,
          },
          screenshot: data.task?.screenshotURL,
          scanUrl: `https://urlscan.io/result/${uuid}/`,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("URLScan status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
