import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/health/engines
 * Check status of all external scanning engines
 */
export async function GET(req: NextRequest) {
  const engines = {
    googleSafeBrowsing: {
      configured: !!process.env.GOOGLE_SAFE_BROWSING_API_KEY,
      status: "unknown"
    },
    phishTank: {
      configured: !!process.env.PHISHTANK_API_KEY && process.env.PHISHTANK_API_KEY !== "YOUR_PHISHTANK_KEY_HERE",
      status: "unknown"
    },
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
    // Google Safe Browsing
    engines.googleSafeBrowsing.configured
      ? fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client: { clientId: "phishguard", clientVersion: "1.0" },
            threatInfo: {
              threatTypes: ["MALWARE"],
              platformTypes: ["ANY_PLATFORM"],
              threatEntryTypes: ["URL"],
              threatEntries: [{ url: "https://test.example.com" }]
            }
          }),
          signal: AbortSignal.timeout(3000)
        }).then(r => r.ok)
      : Promise.resolve(false),

    // PhishTank (just check if key is valid format)
    Promise.resolve(engines.phishTank.configured),

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

  engines.googleSafeBrowsing.status = checks[0].status === 'fulfilled' && checks[0].value ? 'healthy' : 'error';
  engines.phishTank.status = checks[1].status === 'fulfilled' && checks[1].value ? 'healthy' : 'error';
  engines.virusTotal.status = checks[2].status === 'fulfilled' && checks[2].value ? 'healthy' : 'error';
  engines.urlScan.status = checks[3].status === 'fulfilled' && checks[3].value ? 'healthy' : 'error';

  const healthyCount = Object.values(engines).filter(e => e.status === 'healthy').length;
  const configuredCount = Object.values(engines).filter(e => e.configured).length;

  return NextResponse.json({
    success: true,
    data: {
      engines,
      summary: {
        total: 4,
        configured: configuredCount,
        healthy: healthyCount,
        status: healthyCount >= 2 ? 'operational' : healthyCount >= 1 ? 'degraded' : 'critical'
      }
    }
  });
}
