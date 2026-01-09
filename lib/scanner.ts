import https from "https";
import http from "http";
import { URL } from "url";
import dns from "dns/promises";

/**
 * URL Scanner Utility
 * Provides comprehensive URL analysis for phishing detection
 */

export interface ScanResult {
  status: "safe" | "warning" | "danger";
  score: number;
  confidence: number;
  verdict: {
    isSafe: boolean;
    isPhishing: boolean;
    isMalware: boolean;
    isSpam: boolean;
    category: string;
  };
  analysis: {
    domain: {
      name: string;
      age?: number;
      registrar?: string;
      country?: string;
      reputation: string;
    };
    security: {
      hasHttps: boolean;
      hasSsl: boolean;
      certificate?: any;
    };
    content?: {
      title?: string;
      hasLoginForm?: boolean;
      externalLinks?: number;
      suspiciousScripts?: boolean;
    };
    ml: {
      localScore?: number;
      cloudScore: number;
      combinedScore: number;
      model: string;
    };
    threat: {
      databases: string[];
      lastReported?: Date;
      reportCount: number;
      engineDetails?: any;
    };
  };
  factors: string[];
  recommendation: string;
}

/**
 * Validate and parse URL
 */
export function validateUrl(urlString: string): URL | null {
  try {
    const url = new URL(urlString);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

/**
 * Extract domain information
 */
export async function analyzeDomain(url: URL): Promise<{
  name: string;
  age?: number;
  registrar?: string;
  country?: string;
  reputation: string;
}> {
  const domain = url.hostname;
  const factors: string[] = [];

  // Check if domain resolves
  let resolves = true;
  try {
    await dns.resolve4(domain);
  } catch {
    try {
      await dns.resolve6(domain);
    } catch {
      resolves = false;
      factors.push("Domain does not resolve");
    }
  }

  // Basic reputation analysis
  let reputation = "unknown";
  
  // Check for suspicious TLDs
  const suspiciousTlds = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top"];
  if (suspiciousTlds.some((tld) => domain.endsWith(tld))) {
    factors.push("Suspicious TLD");
    reputation = "suspicious";
  }

  // Check for IP address instead of domain
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    factors.push("URL uses IP address instead of domain");
    reputation = "suspicious";
  }

  // Check for excessive subdomains
  const parts = domain.split(".");
  if (parts.length > 4) {
    factors.push("Excessive subdomain levels");
    reputation = "suspicious";
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /paypal/i,
    /login/i,
    /secure/i,
    /account/i,
    /update/i,
    /verify/i,
    /banking/i,
  ];
  
  const legitimateDomains = ["paypal.com", "login.microsoft.com"];
  const isLegitimate = legitimateDomains.some((d) => domain.endsWith(d));
  
  if (!isLegitimate) {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(domain)) {
        factors.push(`Domain contains suspicious keyword: ${pattern.source}`);
        reputation = "suspicious";
        break;
      }
    }
  }

  if (resolves && reputation === "unknown") {
    reputation = "good";
  }

  return {
    name: domain,
    reputation,
  };
}

/**
 * Check SSL certificate and HTTPS
 */
export async function analyzeSecurity(url: URL): Promise<{
  hasHttps: boolean;
  hasSsl: boolean;
  certificate?: any;
}> {
  const hasHttps = url.protocol === "https:";

  if (!hasHttps) {
    return {
      hasHttps: false,
      hasSsl: false,
    };
  }

  // Try to get SSL certificate info
  return new Promise((resolve) => {
    const options = {
      hostname: url.hostname,
      port: 443,
      method: "GET",
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      const cert = (res.socket as any).getPeerCertificate();
      resolve({
        hasHttps: true,
        hasSsl: true,
        certificate: cert
          ? {
              subject: cert.subject,
              issuer: cert.issuer,
              validFrom: cert.valid_from,
              validTo: cert.valid_to,
            }
          : undefined,
      });
      req.abort();
    });

    req.on("error", () => {
      resolve({
        hasHttps: true,
        hasSsl: false,
      });
    });

    req.setTimeout(5000, () => {
      req.abort();
      resolve({
        hasHttps: true,
        hasSsl: false,
      });
    });

    req.end();
  });
}

/**
 * Analyze URL content (basic)
 */
export async function analyzeContent(url: URL): Promise<{
  title?: string;
  hasLoginForm?: boolean;
  externalLinks?: number;
  suspiciousScripts?: boolean;
}> {
  return new Promise((resolve) => {
    const protocol = url.protocol === "https:" ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.protocol === "https:" ? 443 : 80,
      path: url.pathname + url.search,
      method: "GET",
      headers: {
        "User-Agent": "PhishGuard-Scanner/1.0",
      },
      timeout: 10000,
    };

    const req = protocol.request(options, (res) => {
      let data = "";
      let chunks = 0;
      const maxChunks = 100; // Limit data size

      res.on("data", (chunk) => {
        if (chunks++ < maxChunks) {
          data += chunk.toString();
        }
      });

      res.on("end", () => {
        // Extract title
        const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : undefined;

        // Check for login forms
        const hasLoginForm =
          /type=["']?password["']?/i.test(data) ||
          /(login|signin|log-in|sign-in)/i.test(data);

        // Count external links (rough estimate)
        const linkMatches = data.match(/href=["']https?:\/\/[^"']+["']/gi);
        const externalLinks = linkMatches ? linkMatches.length : 0;

        // Check for suspicious scripts
        const suspiciousScripts =
          /eval\(/i.test(data) ||
          /document\.write\(/i.test(data) ||
          /fromCharCode/i.test(data);

        resolve({
          title,
          hasLoginForm,
          externalLinks,
          suspiciousScripts,
        });
      });
    });

    req.on("error", () => {
      resolve({});
    });

    req.on("timeout", () => {
      req.abort();
      resolve({});
    });

    req.end();
  });
}

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced threat database checking with detailed results
 */
export async function checkThreatDatabases(
  url: string
): Promise<{
  databases: string[];
  lastReported?: Date;
  reportCount: number;
  engineDetails?: any;
}> {
  const databases: string[] = [];
  let reportCount = 0;
  const engineDetails: any = {};

  // ENGINE 2: Google Safe Browsing API
  if (process.env.GOOGLE_SAFE_BROWSING_API_KEY) {
    try {
      const response = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client: {
              clientId: "phishguard-backend",
              clientVersion: "1.0.0",
            },
            threatInfo: {
              threatTypes: [
                "MALWARE",
                "SOCIAL_ENGINEERING",
                "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION",
              ],
              platformTypes: ["ANY_PLATFORM"],
              threatEntryTypes: ["URL"],
              threatEntries: [{ url }],
            },
          }),
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        engineDetails.googleSafeBrowsing = {
          status: data.matches && data.matches.length > 0 ? "THREAT_DETECTED" : "CLEAN",
          matches: data.matches || [],
          threatCount: data.matches?.length || 0,
        };
        
        if (data.matches && data.matches.length > 0) {
          databases.push("Google Safe Browsing");
          reportCount += data.matches.length;
          console.log(`[ENGINE 2] Google detected: ${data.matches.length} threats`);
        } else {
          console.log("[ENGINE 2] Google: URL is clean");
        }
      } else {
        const errorText = await response.text();
        console.error(`[ENGINE 2] Google API returned ${response.status}: ${errorText}`);
        engineDetails.googleSafeBrowsing = { status: "ERROR", error: errorText };
      }
    } catch (error: any) {
      console.error("[ENGINE 2] Google Safe Browsing check failed:", error);
      engineDetails.googleSafeBrowsing = { status: "ERROR", error: error.message };
    }
  } else {
    console.warn("[ENGINE 2] Google Safe Browsing API key not configured");
    engineDetails.googleSafeBrowsing = { status: "NOT_CONFIGURED" };
  }

  // ENGINE 3: PhishTank API
  if (process.env.PHISHTANK_API_KEY && process.env.PHISHTANK_API_KEY !== "YOUR_PHISHTANK_KEY_HERE") {
    try {
      const encodedUrl = encodeURIComponent(url);
      const response = await fetch(
        `https://checkurl.phishtank.com/checkurl/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `url=${encodedUrl}&format=json&app_key=${process.env.PHISHTANK_API_KEY}`,
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        engineDetails.phishTank = {
          status: data.results?.in_database && data.results?.valid ? "PHISHING_DETECTED" : "CLEAN",
          inDatabase: data.results?.in_database || false,
          verified: data.results?.valid || false,
          phishId: data.results?.phish_id || null,
          phishDetailUrl: data.results?.phish_detail_page || null,
        };
        
        if (data.results && data.results.in_database && data.results.valid) {
          databases.push("PhishTank");
          reportCount++;
          console.log("[ENGINE 3] PhishTank detected: URL is in phishing database");
        } else {
          console.log("[ENGINE 3] PhishTank: URL not in database");
        }
      } else {
        const errorText = await response.text();
        console.error(`[ENGINE 3] PhishTank API returned ${response.status}: ${errorText}`);
        engineDetails.phishTank = { status: "ERROR", error: errorText };
      }
    } catch (error: any) {
      console.error("[ENGINE 3] PhishTank check failed:", error);
      engineDetails.phishTank = { status: "ERROR", error: error.message };
    }
  } else {
    console.warn("[ENGINE 3] PhishTank API key not configured");
    engineDetails.phishTank = { status: "NOT_CONFIGURED" };
  }

  // ENGINE 4: VirusTotal API (Enhanced with detailed data extraction)
  if (process.env.VIRUSTOTAL_API_KEY) {
    try {
      // VirusTotal uses base64-encoded URL without padding
      const urlId = Buffer.from(url).toString("base64").replace(/=/g, "");
      const response = await fetch(
        `https://www.virustotal.com/api/v3/urls/${urlId}`,
        {
          headers: {
            "x-apikey": process.env.VIRUSTOTAL_API_KEY,
          },
          signal: AbortSignal.timeout(6000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const stats = data.data?.attributes?.last_analysis_stats || {};
        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;
        const undetected = stats.undetected || 0;
        const harmless = stats.harmless || 0;
        const total = malicious + suspicious + undetected + harmless;
        
        // Extract detailed information
        engineDetails.virusTotal = {
          status: malicious > 0 ? "MALICIOUS" : suspicious > 0 ? "SUSPICIOUS" : "CLEAN",
          analysisStats: stats,
          malicious,
          suspicious,
          undetected,
          harmless,
          total,
          categories: data.data?.attributes?.categories || {},
          lastAnalysisDate: data.data?.attributes?.last_analysis_date,
          lastSubmissionDate: data.data?.attributes?.last_submission_date,
          reputation: data.data?.attributes?.reputation || 0,
          totalVotes: data.data?.attributes?.total_votes || {},
          // HTTP response details
          lastHttpResponseCode: data.data?.attributes?.last_http_response_code,
          lastHttpResponseHeaders: data.data?.attributes?.last_http_response_headers,
          lastHttpResponseContentLength: data.data?.attributes?.last_http_response_content_length,
          lastHttpResponseContentSha256: data.data?.attributes?.last_http_response_content_sha256,
          // HTML metadata
          title: data.data?.attributes?.title,
          favicon: data.data?.attributes?.favicon,
          // Redirection
          lastFinalUrl: data.data?.attributes?.last_final_url,
          redirectionChain: data.data?.attributes?.redirection_chain || [],
          // Trackers
          trackers: data.data?.attributes?.trackers || {},
          // Tags
          tags: data.data?.attributes?.tags || [],
        };
        
        if (malicious > 0) {
          databases.push("VirusTotal");
          reportCount += malicious;
          console.log(`[ENGINE 4] VirusTotal detected: ${malicious}/${total} engines flagged as malicious`);
        } else {
          console.log(`[ENGINE 4] VirusTotal: Clean (0/${total} engines flagged)`);
        }
      } else if (response.status === 404) {
        // URL not yet analyzed, submit it for scanning
        console.log("[ENGINE 4] VirusTotal: URL not found, submitting for analysis...");
        try {
          const submitResponse = await fetch(
            "https://www.virustotal.com/api/v3/urls",
            {
              method: "POST",
              headers: {
                "x-apikey": process.env.VIRUSTOTAL_API_KEY,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: `url=${encodeURIComponent(url)}`,
              signal: AbortSignal.timeout(5000),
            }
          );
          
          if (submitResponse.ok) {
            const submitData = await submitResponse.json();
            engineDetails.virusTotal = {
              status: "SUBMITTED",
              message: "URL submitted for analysis",
              analysisId: submitData.data?.id,
            };
            console.log("[ENGINE 4] VirusTotal: URL submitted successfully");
          }
        } catch (submitError) {
          console.error("[ENGINE 4] VirusTotal submission failed:", submitError);
        }
      } else {
        const errorText = await response.text();
        console.error(`[ENGINE 4] VirusTotal API returned ${response.status}: ${errorText}`);
        engineDetails.virusTotal = { status: "ERROR", error: errorText };
      }
    } catch (error: any) {
      console.error("[ENGINE 4] VirusTotal check failed:", error);
      engineDetails.virusTotal = { status: "ERROR", error: error.message };
    }
  } else {
    console.warn("[ENGINE 4] VirusTotal API key not configured");
    engineDetails.virusTotal = { status: "NOT_CONFIGURED" };
  }

  // ENGINE 5: URLScan.io API (Enhanced with result polling)
  if (process.env.URLSCAN_API_KEY) {
    try {
      // Submit URL for scanning
      const submitResponse = await fetch(
        "https://urlscan.io/api/v1/scan/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "API-Key": process.env.URLSCAN_API_KEY,
          },
          body: JSON.stringify({
            url: url,
            visibility: "unlisted",
          }),
          signal: AbortSignal.timeout(5000),
        }
      );

      if (submitResponse.ok) {
        const submitData = await submitResponse.json();
        const uuid = submitData.uuid;
        console.log(`[ENGINE 5] URLScan.io: Scan submitted (UUID: ${uuid})`);
        
        // Poll for results (max 3 attempts, 5 seconds apart)
        let scanComplete = false;
        let attempts = 0;
        let resultData = null;
        
        while (!scanComplete && attempts < 3) {
          attempts++;
          await sleep(5000); // Wait 5 seconds before checking
          
          try {
            const resultResponse = await fetch(
              `https://urlscan.io/api/v1/result/${uuid}/`,
              {
                headers: {
                  "API-Key": process.env.URLSCAN_API_KEY,
                },
                signal: AbortSignal.timeout(5000),
              }
            );
            
            if (resultResponse.ok) {
              resultData = await resultResponse.json();
              scanComplete = true;
              console.log(`[ENGINE 5] URLScan.io: Results retrieved successfully`);
            } else if (resultResponse.status === 404) {
              console.log(`[ENGINE 5] URLScan.io: Scan still processing (attempt ${attempts}/3)...`);
            }
          } catch (pollError) {
            console.log(`[ENGINE 5] URLScan.io: Polling attempt ${attempts} failed`);
          }
        }
        
        if (resultData) {
          // Extract detailed scan results
          const verdict = resultData.verdicts?.overall || {};
          const page = resultData.page || {};
          const stats = resultData.stats || {};
          const meta = resultData.meta?.processors || {};
          
          engineDetails.urlScan = {
            status: verdict.malicious ? "MALICIOUS" : verdict.score > 0 ? "SUSPICIOUS" : "CLEAN",
            uuid: uuid,
            scanUrl: `https://urlscan.io/result/${uuid}/`,
            verdict: {
              score: verdict.score || 0,
              malicious: verdict.malicious || false,
              categories: verdict.categories || [],
              brands: verdict.brands || [],
            },
            page: {
              url: page.url,
              domain: page.domain,
              country: page.country,
              city: page.city,
              server: page.server,
              ip: page.ip,
              asn: page.asn,
              asnname: page.asnname,
            },
            stats: {
              uniqIPs: stats.uniqIPs || 0,
              uniqCountries: stats.uniqCountries || 0,
              dataLength: stats.dataLength || 0,
              encodedDataLength: stats.encodedDataLength || 0,
              requests: stats.requests || 0,
            },
            meta: {
              processors: meta,
            },
            // Screenshot
            screenshot: resultData.task?.screenshotURL,
            // Technologies detected
            technologies: page.technologies || [],
            // Certificate info
            tlsCertificate: page.tlsCertificate,
          };
          
          if (verdict.malicious) {
            databases.push("URLScan.io");
            reportCount++;
          }
        } else {
          // Scan still processing
          engineDetails.urlScan = {
            status: "PROCESSING",
            message: "Scan submitted, results pending",
            uuid: uuid,
            scanUrl: `https://urlscan.io/result/${uuid}/`,
          };
        }
      } else {
        const errorText = await submitResponse.text();
        console.error(`[ENGINE 5] URLScan.io API returned ${submitResponse.status}: ${errorText}`);
        engineDetails.urlScan = { status: "ERROR", error: errorText };
      }
    } catch (error: any) {
      console.error("[ENGINE 5] URLScan.io check failed:", error);
      engineDetails.urlScan = { status: "ERROR", error: error.message };
    }
  } else {
    console.warn("[ENGINE 5] URLScan.io API key not configured");
    engineDetails.urlScan = { status: "NOT_CONFIGURED" };
  }

  return {
    databases,
    reportCount,
    engineDetails,
  };
}

/**
 * Calculate ML-based cloud score
 */
export function calculateCloudScore(
  domainAnalysis: Awaited<ReturnType<typeof analyzeDomain>>,
  securityAnalysis: Awaited<ReturnType<typeof analyzeSecurity>>,
  contentAnalysis: Awaited<ReturnType<typeof analyzeContent>>,
  threatAnalysis: Awaited<ReturnType<typeof checkThreatDatabases>>
): number {
  let score = 0;

  // Domain reputation (0-30 points)
  if (domainAnalysis.reputation === "suspicious") {
    score += 30;
  } else if (domainAnalysis.reputation === "unknown") {
    score += 15;
  }

  // Security (0-20 points)
  if (!securityAnalysis.hasHttps) {
    score += 15;
  }
  if (!securityAnalysis.hasSsl) {
    score += 5;
  }

  // Content analysis (0-20 points)
  if (contentAnalysis.hasLoginForm) {
    score += 10;
  }
  if (contentAnalysis.suspiciousScripts) {
    score += 10;
  }

  // Threat databases (0-30 points)
  if (threatAnalysis.reportCount > 0) {
    score += Math.min(30, threatAnalysis.reportCount * 10);
  }

  return Math.min(100, score);
}

/**
 * Main scanning function
 */
export async function scanUrl(
  urlString: string,
  localScore?: number,
  localFactors?: string[]
): Promise<ScanResult> {
  const startTime = Date.now();
  
  const url = validateUrl(urlString);
  if (!url) {
    throw new Error("Invalid URL format");
  }

  // Perform all analyses
  const [domainAnalysis, securityAnalysis, contentAnalysis, threatAnalysis] =
    await Promise.all([
      analyzeDomain(url),
      analyzeSecurity(url),
      analyzeContent(url),
      checkThreatDatabases(urlString),
    ]);

  // Calculate cloud score
  const cloudScore = calculateCloudScore(
    domainAnalysis,
    securityAnalysis,
    contentAnalysis,
    threatAnalysis
  );

  // Combine local and cloud scores
  const combinedScore =
    localScore !== undefined
      ? Math.round((localScore * 0.4 + cloudScore * 0.6))
      : cloudScore;

  // Determine status
  let status: "safe" | "warning" | "danger";
  if (combinedScore >= 70) {
    status = "danger";
  } else if (combinedScore >= 40) {
    status = "warning";
  } else {
    status = "safe";
  }

  // Build factors list
  const factors: string[] = [...(localFactors || [])];
  
  if (domainAnalysis.reputation === "suspicious") {
    factors.push("Suspicious domain reputation");
  }
  if (!securityAnalysis.hasHttps) {
    factors.push("No HTTPS encryption");
  }
  if (!securityAnalysis.hasSsl) {
    factors.push("Invalid or missing SSL certificate");
  }
  if (contentAnalysis.hasLoginForm) {
    factors.push("Contains login form");
  }
  if (contentAnalysis.suspiciousScripts) {
    factors.push("Suspicious JavaScript detected");
  }
  if (threatAnalysis.databases.length > 0) {
    factors.push(
      `Reported in threat databases: ${threatAnalysis.databases.join(", ")}`
    );
  }

  // Generate recommendation
  let recommendation = "";
  if (status === "danger") {
    recommendation =
      "⚠️ DANGER: This URL is highly suspicious and likely malicious. Do not visit this site or enter any personal information.";
  } else if (status === "warning") {
    recommendation =
      "⚠️ WARNING: This URL shows suspicious characteristics. Exercise caution and verify the authenticity before proceeding.";
  } else {
    recommendation =
      "✅ SAFE: This URL appears to be safe based on our analysis. However, always exercise caution online.";
  }

  const confidence = Math.min(
    0.95,
    0.5 +
      (threatAnalysis.reportCount > 0 ? 0.3 : 0) +
      (securityAnalysis.hasSsl ? 0.1 : 0) +
      (factors.length > 3 ? 0.15 : 0)
  );

  return {
    status,
    score: combinedScore,
    confidence,
    verdict: {
      isSafe: status === "safe",
      isPhishing: status === "danger" && factors.some((f) => f.includes("phish")),
      isMalware: threatAnalysis.databases.includes("Google Safe Browsing"),
      isSpam: false,
      category: status === "danger" ? "malicious" : status === "warning" ? "suspicious" : "legitimate",
    },
    analysis: {
      domain: domainAnalysis,
      security: securityAnalysis,
      content: contentAnalysis,
      ml: {
        localScore,
        cloudScore,
        combinedScore,
        model: "PhishGuard-v1.0",
      },
      threat: threatAnalysis,
    },
    factors,
    recommendation,
  };
}
