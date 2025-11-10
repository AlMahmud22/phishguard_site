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

/**
 * Check against threat databases
 */
export async function checkThreatDatabases(
  url: string
): Promise<{
  databases: string[];
  lastReported?: Date;
  reportCount: number;
}> {
  const databases: string[] = [];
  let reportCount = 0;

  // Google Safe Browsing API
  if (process.env.GOOGLE_SAFE_BROWSING_API_KEY) {
    try {
      const response = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client: {
              clientId: "phishguard",
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
        }
      );

      const data = await response.json();
      if (data.matches && data.matches.length > 0) {
        databases.push("Google Safe Browsing");
        reportCount += data.matches.length;
      }
    } catch (error) {
      console.error("Google Safe Browsing check failed:", error);
    }
  }

  // PhishTank API
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(
      `https://checkurl.phishtank.com/checkurl/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `url=${encodedUrl}&format=json&app_key=${process.env.PHISHTANK_API_KEY || ""}`,
      }
    );

    const data = await response.json();
    if (data.results && data.results.in_database && data.results.valid) {
      databases.push("PhishTank");
      reportCount++;
    }
  } catch (error) {
    console.error("PhishTank check failed:", error);
  }

  // VirusTotal API (if configured)
  if (process.env.VIRUSTOTAL_API_KEY) {
    try {
      const urlId = Buffer.from(url).toString("base64").replace(/=/g, "");
      const response = await fetch(
        `https://www.virustotal.com/api/v3/urls/${urlId}`,
        {
          headers: {
            "x-apikey": process.env.VIRUSTOTAL_API_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const malicious = data.data?.attributes?.last_analysis_stats?.malicious || 0;
        if (malicious > 0) {
          databases.push("VirusTotal");
          reportCount += malicious;
        }
      }
    } catch (error) {
      console.error("VirusTotal check failed:", error);
    }
  }

  return {
    databases,
    reportCount,
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
