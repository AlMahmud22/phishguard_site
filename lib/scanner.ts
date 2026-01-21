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
  partial?: boolean;
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
  engines?: {
    engine1?: EngineResult;
    engine2?: EngineResult;
    engine3?: EngineResult;
    engine4?: EngineResult;
    engine5?: EngineResult;
  };
  scoring?: {
    enginesUsed: string[];
    engineCount: number;
    consensus?: number;
  };
  factors: string[];
  recommendation: string;
}

export interface EngineResult {
  detected: boolean;
  status: string;
  score?: number;
  confidence?: number;
  source?: string;
  stats?: any;
  metadata?: any;
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
  console.log(`[checkThreatDatabases] Starting threat database checks for: ${url}`);
  console.log(`[checkThreatDatabases] VirusTotal API Key: ${process.env.VIRUSTOTAL_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  console.log(`[checkThreatDatabases] URLScan API Key: ${process.env.URLSCAN_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  
  const databases: string[] = [];
  let reportCount = 0;
  const engineDetails: any = {};

  // ENGINE 2: VirusTotal API (Enhanced with detailed data extraction)
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
        const attrs = data.data?.attributes || {};
        const stats = attrs.last_analysis_stats || {};
        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;
        const undetected = stats.undetected || 0;
        const harmless = stats.harmless || 0;
        const timeout = stats.timeout || 0;
        const total = malicious + suspicious + undetected + harmless + timeout;
        
        // Extract ALL vendor results for detailed display
        const vendorResults: any[] = [];
        const analysisResults = attrs.last_analysis_results || {};
        for (const [vendorName, result] of Object.entries(analysisResults)) {
          const vendorData: any = result;
          vendorResults.push({
            engine: vendorName,
            category: vendorData.category || 'undetected',
            result: vendorData.result || 'clean',
            method: vendorData.method || '',
            engineName: vendorData.engine_name || vendorName,
            engineVersion: vendorData.engine_version || '',
            engineUpdate: vendorData.engine_update || '',
          });
        }
        
        // Extract categorization from multiple sources
        const categories = attrs.categories || {};
        const categoriesList: any[] = [];
        for (const [source, category] of Object.entries(categories)) {
          categoriesList.push({ source, category });
        }
        
        // Extract HTML metadata
        const htmlMeta = attrs.html_meta || {};
        const htmlMetadata = {
          title: attrs.title || htmlMeta.title || '',
          description: htmlMeta.description || '',
          keywords: htmlMeta.keywords || '',
          charset: htmlMeta.charset || '',
          language: htmlMeta.language || '',
          favicon: attrs.favicon ? {
            dhash: attrs.favicon.dhash,
            rawMd5: attrs.favicon.raw_md5,
          } : null,
        };
        
        // Extract domain & URL metadata
        const urlParts = new URL(url);
        const domainMetadata = {
          domain: urlParts.hostname,
          subdomain: urlParts.hostname.split('.').length > 2 ? urlParts.hostname.split('.').slice(0, -2).join('.') : '',
          tld: urlParts.hostname.split('.').pop() || '',
          reputation: attrs.reputation || 0,
          timesSubmitted: attrs.times_submitted || 0,
        };
        
        // Extract detailed information
        engineDetails.virusTotal = {
          status: malicious > 0 ? "MALICIOUS" : suspicious > 0 ? "SUSPICIOUS" : "CLEAN",
          
          // 1. URL Overview
          submittedUrl: url,
          normalizedUrl: attrs.url || url,
          lastFinalUrl: attrs.last_final_url || url,
          urlStatus: malicious > 0 ? 'malicious' : suspicious > 0 ? 'suspicious' : harmless > 0 ? 'clean' : 'unknown',
          firstSubmissionDate: attrs.first_submission_date,
          lastAnalysisDate: attrs.last_analysis_date,
          lastSubmissionDate: attrs.last_submission_date,
          lastModificationDate: attrs.last_modification_date,
          
          // 2. Detection Summary
          analysisStats: stats,
          malicious,
          suspicious,
          undetected,
          harmless,
          timeout,
          total,
          reputation: attrs.reputation || 0,
          totalVotes: attrs.total_votes || { harmless: 0, malicious: 0 },
          
          // 3. Security Vendor Results (ALL VENDORS)
          vendorResults: vendorResults,
          totalVendors: vendorResults.length,
          
          // 4. URL Categorization
          categories: categoriesList,
          
          // 5. HTML Metadata
          htmlMetadata: htmlMetadata,
          
          // 6. Domain & URL Metadata
          domainMetadata: domainMetadata,
          
          // 7. Historical Context
          timesSubmitted: attrs.times_submitted || 0,
          
          // Additional details
          lastHttpResponseCode: attrs.last_http_response_code,
          lastHttpResponseHeaders: attrs.last_http_response_headers || {},
          lastHttpResponseContentLength: attrs.last_http_response_content_length,
          lastHttpResponseContentSha256: attrs.last_http_response_content_sha256,
          redirectionChain: attrs.redirection_chain || [],
          trackers: attrs.trackers || {},
          tags: attrs.tags || [],
          outgoingLinks: attrs.outgoing_links || 0,
          incomingLinks: attrs.incoming_links || 0,
        };
        
        if (malicious > 0) {
          databases.push("VirusTotal");
          reportCount += malicious;
          console.log(`[ENGINE 2] VirusTotal detected: ${malicious}/${total} engines flagged as malicious`);
        } else {
          console.log(`[ENGINE 2] VirusTotal: Clean (0/${total} engines flagged)`);
        }
      } else if (response.status === 404) {
        // URL not yet analyzed, submit it for scanning
        console.log("[ENGINE 2] VirusTotal: URL not found, submitting for analysis...");
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
            console.log("[ENGINE 2] VirusTotal: URL submitted successfully");
          }
        } catch (submitError) {
          console.error("[ENGINE 2] VirusTotal submission failed:", submitError);
        }
      } else {
        const errorText = await response.text();
        console.error(`[ENGINE 2] VirusTotal API returned ${response.status}: ${errorText}`);
        engineDetails.virusTotal = { status: "ERROR", error: errorText };
      }
    } catch (error: any) {
      console.error("[ENGINE 2] VirusTotal check failed:", error);
      engineDetails.virusTotal = { status: "ERROR", error: error.message };
    }
  } else {
    console.warn("[ENGINE 2] VirusTotal API key not configured");
    engineDetails.virusTotal = { status: "NOT_CONFIGURED" };
  }

  // ENGINE 3: URLScan.io API (Enhanced with full data extraction)
  if (process.env.URLSCAN_API_KEY) {
    try {
      // Step 1: Submit URL for scanning
      console.log(`[ENGINE 3] URLScan.io: Submitting URL for scan...`);
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

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error(`[ENGINE 3] URLScan.io API returned ${submitResponse.status}: ${errorText}`);
        engineDetails.urlScan = { status: "ERROR", error: errorText };
      } else {
        const submitData = await submitResponse.json();
        const uuid = submitData.uuid;
        console.log(`[ENGINE 3] URLScan.io: Scan submitted (UUID: ${uuid})`);
        
        // Step 2: Poll for results (max 6 attempts with 5-second delays = 30 seconds total)
        let attempts = 0;
        let resultData: any = null;
        const maxAttempts = 6;
        const pollDelay = 5000; // 5 seconds
        
        while (attempts < maxAttempts && !resultData) {
          attempts++;
          console.log(`[ENGINE 3] URLScan.io: Waiting ${pollDelay/1000}s before checking results (attempt ${attempts}/${maxAttempts})...`);
          
          // Wait before polling
          await new Promise(resolve => setTimeout(resolve, pollDelay));
          
          try {
            const resultResponse = await fetch(
              `https://urlscan.io/api/v1/result/${uuid}/`,
              {
                headers: {
                  "API-Key": process.env.URLSCAN_API_KEY,
                },
                signal: AbortSignal.timeout(10000),
              }
            );
            
            if (resultResponse.ok) {
              resultData = await resultResponse.json();
              console.log(`[ENGINE 3] URLScan.io: Results retrieved successfully on attempt ${attempts}`);
              break;
            } else if (resultResponse.status === 404) {
              console.log(`[ENGINE 3] URLScan.io: Scan still processing (attempt ${attempts}/${maxAttempts})...`);
              // Continue polling
            } else {
              const errorText = await resultResponse.text();
              console.error(`[ENGINE 3] URLScan.io: Result fetch failed ${resultResponse.status}: ${errorText}`);
              break;
            }
          } catch (pollError: any) {
            console.error(`[ENGINE 3] URLScan.io: Polling attempt ${attempts} error:`, pollError.message);
            // Continue to next attempt unless it's the last one
            if (attempts === maxAttempts) {
              break;
            }
          }
        }
        
        // Step 3: Extract and structure the data
        if (!resultData) {
          // Scan still processing after all attempts
          console.warn(`[ENGINE 3] URLScan.io: Scan still processing after ${maxAttempts} attempts`);
          engineDetails.urlScan = {
            status: "PROCESSING",
            message: "Scan in progress - results pending",
            uuid: uuid,
            scanUrl: `https://urlscan.io/result/${uuid}/`,
            apiUrl: `https://urlscan.io/api/v1/result/${uuid}/`,
            attempts: attempts,
          };
        } else {
          // Successfully retrieved results - extract ALL data
          const verdict = resultData.verdicts?.overall || {};
          const page = resultData.page || {};
          const task = resultData.task || {};
          const stats = resultData.stats || {};
          const lists = resultData.lists || {};
          const meta = resultData.meta || {};
          const data = resultData.data || {};
          
          const isMalicious = verdict.malicious || false;
          const verdictScore = verdict.score || 0;
          const categories = verdict.categories || [];
          const brands = verdict.brands || [];
          const tags = verdict.tags || [];
          
          // Extract ALL information from task
          const taskInfo = {
            uuid: uuid,
            visibility: task.visibility || 'unlisted',
            method: task.method || 'api',
            time: task.time,
            source: task.source || 'api',
            url: task.url || url,
            userAgent: task.userAgent,
            reportURL: task.reportURL || `https://urlscan.io/result/${uuid}/`,
            screenshotURL: task.screenshotURL || null,
            domURL: task.domURL || null,
          };
          
          // Extract page metadata with ALL fields
          const pageInfo = {
            url: page.url || url,
            domain: page.domain,
            subdomain: page.subdomain || '',
            apexDomain: page.apexDomain || page.domain,
            country: page.country,
            city: page.city,
            ip: page.ip,
            ipv6: page.ipv6 || '',
            asn: page.asn,
            asnname: page.asnname,
            server: page.server,
            ptr: page.ptr || '',
            redirected: page.redirected || null,
            status: page.status || '',
            mimeType: page.mimeType || '',
            title: page.title || '',
            favicon: {
              hash: page.faviconHash || '',
              mimeType: page.faviconMimeType || '',
            },
            umbrellaRank: page.umbrellaRank || null,
            technologies: Array.isArray(page.technologies) 
              ? page.technologies.map((tech: any) => typeof tech === 'string' ? tech : tech.name || String(tech))
              : [],
          };
          
          // Extract SSL/TLS certificate with ALL fields
          const certificate = page.tlsCertificate ? {
            issuer: page.tlsCertificate.issuer,
            subject: page.tlsCertificate.subject,
            subjectName: page.tlsCertificate.subjectName,
            sanList: page.tlsCertificate.sanList || [],
            validFrom: page.tlsCertificate.validFrom,
            validTo: page.tlsCertificate.validTo,
            serialNumber: page.tlsCertificate.serialNumber,
            signatureAlgorithm: page.tlsCertificate.signatureAlgorithm,
            publicKeyAlgorithm: page.tlsCertificate.publicKeyAlgorithm,
            pubkeyBitsize: page.tlsCertificate.pubkeyBitsize,
          } : null;
          
          // Extract network statistics with ALL data
          const networkStats = {
            requests: stats.requests || 0,
            domains: stats.domains || 0,
            ips: stats.ips || 0,
            ipv4: stats.ipv4 || 0,
            ipv6: stats.ipv6 || 0,
            countries: stats.countries || 0,
            dataLength: stats.dataLength || 0,
            encodedDataLength: stats.encodedDataLength || 0,
            compressionRatio: stats.compressionRatio || 0,
            uniqCountries: stats.uniqCountries || 0,
            totalLinks: stats.totalLinks || 0,
            malicious: stats.malicious || 0,
            adBlocked: stats.adBlocked || 0,
            IPv6Percentage: stats.IPv6Percentage || 0,
            resourceStats: stats.resourceStats || [],
            protocolStats: stats.protocolStats || [],
            tlsStats: stats.tlsStats || [],
            serverStats: stats.serverStats || [],
            regDomainStats: stats.regDomainStats || [],
          };
          
          // Extract ALL lists for comprehensive analysis
          const extractedLists = {
            // IP addresses contacted
            ips: (lists.ips || []).map((ip: any) => ({
              ip: ip,
              asn: lists.asns?.find((a: any) => a.ip === ip) || null,
            })),
            
            // All domains contacted
            domains: lists.domains || [],
            
            // Countries involved
            countries: lists.countries || [],
            
            // All URLs with FULL details
            urls: (lists.urls || []).map((u: any) => ({
              url: u,
              // Find matching request in data.requests for full details
            })),
            
            // ASN information
            asns: lists.asns || [],
            
            // Hashes (resources)
            hashes: lists.hashes || [],
            
            // Certificates
            certificates: lists.certificates || [],
            
            // Servers
            servers: lists.servers || [],
            
            // Links found on page
            linkDomains: lists.linkDomains || [],
          };
          
          // Extract FULL network request/response data
          const requests = (data.requests || []).map((req: any) => ({
            requestId: req.request?.requestId,
            url: req.request?.url || req.url,
            method: req.request?.method,
            headers: req.request?.headers || {},
            postData: req.request?.postData,
            
            // Response data
            status: req.response?.status,
            statusText: req.response?.statusText,
            responseHeaders: req.response?.headers || {},
            mimeType: req.response?.mimeType,
            remoteIPAddress: req.response?.remoteIPAddress,
            remotePort: req.response?.remotePort,
            protocol: req.response?.protocol,
            securityState: req.response?.securityState,
            
            // Resource info
            type: req.type || req.resourceType,
            size: req.size || req.encodedDataLength,
            dataLength: req.dataLength,
            encodedDataLength: req.encodedDataLength,
            
            // Timing
            time: req.time,
            initiator: req.initiator?.type,
          }));
          
          // Extract console messages (JavaScript errors/warnings)
          const consoleMessages = Array.isArray(data.console) 
            ? data.console.map((msg: any) => ({
                type: msg.message?.level || msg.type,
                source: msg.message?.source,
                text: msg.message?.text || msg.message,
                url: msg.message?.url,
                line: msg.message?.line,
                column: msg.message?.column,
              }))
            : [];
          
          // Extract cookies with ALL attributes
          const cookies = Array.isArray(data.cookies)
            ? data.cookies.map((cookie: any) => ({
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path,
                expires: cookie.expires,
                httpOnly: cookie.httpOnly,
                secure: cookie.secure,
                sameSite: cookie.sameSite,
                session: cookie.session,
              }))
            : [];
          
          // Extract DOM snapshot & iframes
          const domInfo = {
            totalIframes: (lists.hashes || []).filter((h: any) => h.type === 'iframe').length,
            iframes: (lists.hashes || [])
              .filter((h: any) => h.type === 'iframe')
              .map((h: any) => ({
                url: h.filename,
                hash: h.hash,
              })),
            totalScripts: (lists.hashes || []).filter((h: any) => h.type === 'script').length,
            scripts: (lists.hashes || [])
              .filter((h: any) => h.type === 'script')
              .map((h: any) => ({
                url: h.filename,
                hash: h.hash,
              })),
          };
          
          // Extract behavior indicators
          const behaviorIndicators = {
            hasIframes: domInfo.totalIframes > 0,
            hasObfuscatedJS: (lists.hashes || []).some((h: any) => h.obfuscated),
            hasDataExfiltration: requests.some((r: any) => r.method === 'POST'),
            hasRedirects: page.redirected ? true : false,
            redirectChain: page.redirected || [],
            hasAutoDownload: requests.some((r: any) => 
              r.responseHeaders?.['content-disposition']?.includes('attachment')
            ),
            hasFormSubmission: requests.some((r: any) => 
              r.method === 'POST' && r.type === 'Document'
            ),
            hasSuspiciousExtensions: requests.some((r: any) =>
              r.url?.match(/\.(exe|zip|rar|7z|dmg|pkg|apk|bat|cmd|ps1|vbs)$/i)
            ),
          };
          
          // Extract meta information
          const metaInfo = {
            processors: meta.processors || {},
          };
          
          engineDetails.urlScan = {
            status: isMalicious ? "MALICIOUS" : verdictScore > 0.5 ? "SUSPICIOUS" : "CLEAN",
            message: isMalicious 
              ? `Malicious content detected (${categories.join(', ')})`
              : verdictScore > 0.5
              ? `Suspicious behavior detected (Score: ${Math.round(verdictScore * 100)}%)`
              : "No malicious behavior detected",
            
            // 1. Scan Overview (from task)
            task: taskInfo,
            
            // 2. Page Summary
            page: pageInfo,
            
            // 3. Screenshot
            screenshot: taskInfo.screenshotURL,
            domSnapshot: taskInfo.domURL,
            
            // 4. Page Infrastructure
            infrastructure: {
              ip: pageInfo.ip,
              ipv6: pageInfo.ipv6,
              asn: pageInfo.asn,
              asnName: pageInfo.asnname,
              country: pageInfo.country,
              city: pageInfo.city,
              server: pageInfo.server,
              ptr: pageInfo.ptr,
            },
            
            // 5. SSL/TLS Certificate
            certificate: certificate,
            
            // 6. Network Activity (ALL requests with full details)
            network: {
              stats: networkStats,
              requests: requests,
            },
            
            // 7. JavaScript & Resources
            javascript: {
              totalScripts: domInfo.totalScripts,
              scripts: domInfo.scripts,
              consoleMessages: consoleMessages,
            },
            
            // 8. DOM & Content
            dom: {
              totalIframes: domInfo.totalIframes,
              iframes: domInfo.iframes,
            },
            
            // 9. Cookies & Storage
            cookies: {
              total: cookies.length,
              details: cookies,
            },
            
            // 10. Behavior Indicators
            behavior: behaviorIndicators,
            
            // 11. Extracted Intelligence Lists
            lists: extractedLists,
            
            // 12. Security Signals
            verdict: {
              malicious: isMalicious,
              score: verdictScore,
              categories: categories,
              brands: brands,
              tags: tags,
              hasSecurityFlags: categories.length > 0 || brands.length > 0 || tags.length > 0,
            },
            
            // 13. Technologies Detected
            technologies: pageInfo.technologies,
            
            // Processing metadata
            meta: metaInfo,
            processingTime: attempts * pollDelay,
            attempts: attempts,
          };
          
          // Update threat databases if malicious
          if (isMalicious) {
            databases.push("URLScan.io");
            reportCount += 1;
            console.log(`[ENGINE 3] URLScan.io detected: MALICIOUS (Categories: ${categories.join(', ')}, Score: ${Math.round(verdictScore * 100)}%)`);
          } else if (verdictScore > 0.5) {
            console.log(`[ENGINE 3] URLScan.io: SUSPICIOUS (Score: ${Math.round(verdictScore * 100)}%)`);
          } else {
            console.log(`[ENGINE 3] URLScan.io: CLEAN (Score: ${Math.round(verdictScore * 100)}%)`);
          }
        }
      }
    } catch (error: any) {
      console.error("[ENGINE 3] URLScan.io check failed:", error);
      engineDetails.urlScan = { 
        status: "ERROR", 
        error: error.message,
        errorType: error.name === 'AbortError' ? 'Timeout' : 'Network Error'
      };
    }
  } else {
    console.warn("[ENGINE 3] URLScan.io API key not configured");
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
  
  console.log(`[scanUrl] Starting scan for: ${urlString}`);
  console.log(`[scanUrl] Local score: ${localScore}, Local factors: ${localFactors?.length || 0}`);
  
  const url = validateUrl(urlString);
  if (!url) {
    throw new Error("Invalid URL format");
  }

  // Perform all analyses with Promise.allSettled for partial success
  console.log(`[scanUrl] Running parallel analyses...`);
  const results = await Promise.allSettled([
    analyzeDomain(url),
    analyzeSecurity(url),
    analyzeContent(url),
    checkThreatDatabases(urlString),
  ]);
  
  console.log(`[scanUrl] Parallel analyses complete:`, {
    domain: results[0].status,
    security: results[1].status,
    content: results[2].status,
    threatDatabases: results[3].status
  });

  // Extract successful results
  const domainAnalysis = results[0].status === 'fulfilled' ? results[0].value : { name: url.hostname, reputation: 'unknown' };
  const securityAnalysis = results[1].status === 'fulfilled' ? results[1].value : { hasHttps: false, hasSsl: false };
  const contentAnalysis = results[2].status === 'fulfilled' ? results[2].value : {};
  const threatAnalysis = results[3].status === 'fulfilled' ? results[3].value : { databases: [], reportCount: 0, engineDetails: {} };
  
  // Log any failures
  if (results[0].status === 'rejected') console.error('[scanUrl] Domain analysis failed:', results[0].reason);
  if (results[1].status === 'rejected') console.error('[scanUrl] Security analysis failed:', results[1].reason);
  if (results[2].status === 'rejected') console.error('[scanUrl] Content analysis failed:', results[2].reason);
  if (results[3].status === 'rejected') console.error('[scanUrl] Threat database check failed:', results[3].reason);

  // Track which engines succeeded
  const successfulEngines: string[] = ['engine1']; // Local ML always present
  let partial = false;

  // Check external engines status
  const engineDetails = threatAnalysis.engineDetails || {};
  const externalEnginesAvailable = [
    engineDetails.virusTotal?.status !== 'NOT_CONFIGURED',
    engineDetails.urlScan?.status !== 'NOT_CONFIGURED'
  ].filter(Boolean).length;

  const externalEnginesSucceeded = [
    engineDetails.virusTotal?.status === 'MALICIOUS' || engineDetails.virusTotal?.status === 'SUSPICIOUS' || engineDetails.virusTotal?.status === 'CLEAN',
    engineDetails.urlScan?.status === 'PROCESSING' || engineDetails.urlScan?.status === 'CLEAN' || engineDetails.urlScan?.status === 'MALICIOUS'
  ].filter(Boolean).length;

  // Mark as partial if less than 50% of external engines succeeded
  if (externalEnginesAvailable > 0 && externalEnginesSucceeded < externalEnginesAvailable / 2) {
    partial = true;
  }

  // Normalize engine results for frontend
  const engines: any = {
    engine1: {
      detected: localScore !== undefined && localScore > 50,
      status: localScore !== undefined && localScore > 70 ? 'DANGER' : localScore && localScore > 40 ? 'WARNING' : 'SAFE',
      score: localScore || 0,
      confidence: 0.8,
      source: 'local_ml'
    }
  };

  // Engine 2: VirusTotal
  if (engineDetails.virusTotal && engineDetails.virusTotal.status !== 'NOT_CONFIGURED') {
    successfulEngines.push('engine2');
    // Spread all VirusTotal data directly into engine2 for comprehensive display
    engines.engine2 = {
      detected: engineDetails.virusTotal.malicious > 0,
      status: engineDetails.virusTotal.status,
      score: engineDetails.virusTotal.total > 0 ? Math.round((engineDetails.virusTotal.malicious / engineDetails.virusTotal.total) * 100) : 0,
      source: 'virustotal',
      // Flatten all VirusTotal data to root level for ScanDetailsView
      ...engineDetails.virusTotal,
    };
  }

  // Engine 3: URLScan.io
  if (engineDetails.urlScan && engineDetails.urlScan.status !== 'NOT_CONFIGURED') {
    successfulEngines.push('engine3');
    // Spread all URLScan data directly into engine3 for comprehensive display
    engines.engine3 = {
      detected: engineDetails.urlScan.status === 'MALICIOUS',
      status: engineDetails.urlScan.status,
      source: 'urlscan',
      message: engineDetails.urlScan.message,
      // Flatten all URLScan data to root level for ScanDetailsView
      ...engineDetails.urlScan,
    };
  }

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

  // Adjust confidence if partial scan
  let confidence = Math.min(
    0.95,
    0.5 +
      (threatAnalysis.reportCount > 0 ? 0.3 : 0) +
      (securityAnalysis.hasSsl ? 0.1 : 0) +
      (factors.length > 3 ? 0.15 : 0)
  );

  if (partial) {
    confidence = Math.min(confidence, 0.6);
  }

  return {
    status,
    score: combinedScore,
    confidence,
    partial,
    verdict: {
      isSafe: status === "safe",
      isPhishing: status === "danger" && factors.some((f) => f.includes("phish")),
      isMalware: threatAnalysis.databases.includes("VirusTotal"),
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
      threat: {
        databases: threatAnalysis.databases,
        reportCount: threatAnalysis.reportCount,
        engineDetails: engineDetails // Include full engine details with all URLScan data
      },
    },
    engines,
    scoring: {
      enginesUsed: successfulEngines,
      engineCount: successfulEngines.length,
      consensus: Math.round((successfulEngines.length / 3) * 100)
    },
    factors,
    recommendation,
  };
}
