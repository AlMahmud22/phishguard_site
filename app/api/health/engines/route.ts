import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/health/engines
 * Check status of external scanning engines (VirusTotal and URLScan.io)
 */
export async function GET(req: NextRequest) {
  const engines = {
    virusTotal: {
      configured: !!process.env.VIRUSTOTAL_API_KEY,
      status: "unknown"
    },
    urlScan: {
      configured: !!process.env.URLSCAN_API_KEY,
      status: "unknown"
    }
  };

  // Quick health checks (with timeout)
  const checks = await Promise.allSettled([
    // VirusTotal
    engines.virusTotal.configured
      ? fetch("https://www.virustotal.com/api/v3/urls/aHR0cHM6Ly90ZXN0LmV4YW1wbGUuY29t", {
          headers: { "x-apikey": process.env.VIRUSTOTAL_API_KEY! },
          signal: AbortSignal.timeout(3000)
        }).then(r => r.ok || r.status === 404) // 404 is acceptable (URL not analyzed)
      : Promise.resolve(false),

    // URLScan
    engines.urlScan.configured
      ? fetch("https://urlscan.io/api/v1/scan/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "API-Key": process.env.URLSCAN_API_KEY!
          },
          body: JSON.stringify({ url: "https://test.example.com", visibility: "unlisted" }),
          signal: AbortSignal.timeout(3000)
        }).then(r => r.ok || r.status === 429) // 429 means rate limited but key is valid
      : Promise.resolve(false)
  ]);

  engines.virusTotal.status = checks[0].status === 'fulfilled' && checks[0].value ? 'healthy' : 'error';
  engines.urlScan.status = checks[1].status === 'fulfilled' && checks[1].value ? 'healthy' : 'error';

  const healthyCount = Object.values(engines).filter(e => e.status === 'healthy').length;
  const configuredCount = Object.values(engines).filter(e => e.configured).length;

  return NextResponse.json({
    success: true,
    data: {
      engines,
      summary: {
        total: 2,
        configured: configuredCount,
        healthy: healthyCount,
        status: healthyCount >= 2 ? 'operational' : healthyCount >= 1 ? 'degraded' : 'critical'
      }
    }
  });
}
