/**
 * Engine 3: Behavioral Analysis (10% weight)
 * Visual and DOM inspection, network traffic analysis
 * Rate limit: 10/min, unlimited/day
 */

import axios from 'axios';

export interface Engine3Result {
  available: boolean;
  detected?: boolean;
  score?: number;
  task?: {
    uuid: string;
    reportURL: string;
    screenshotURL: string;
    time: Date;
  };
  verdict?: {
    malicious: boolean;
    score: number;
    categories: string[];
    brands: string[];
    tags: string[];
  };
  page?: {
    url: string;
    domain: string;
    apexDomain?: string;
    ip: string;
    country: string;
    city?: string;
    asn?: string;
    asnname?: string;
    server: string;
    title: string;
    umbrellaRank?: number;
  };
  stats?: {
    requests: number;
    ips: number;
    countries: number;
    domains: number;
    dataLength: number;
  };
  technologies?: Array<{
    name: string;
    version?: string;
    categories: string[];
  }>;
  network?: {
    ips: string[];
    domains: string[];
    urls: string[];
    servers?: string[];
  };
  dom?: {
    scripts: Array<{ url: string; type?: string; size?: number }>;
    iframes: Array<{ url: string; width?: number; height?: number }>;
    forms: Array<{ action: string; method: string; inputs?: any[] }>;
    links?: Array<{ href: string; text: string }>;
  };
  certificate?: {
    issuer: string;
    validFrom: string;
    validTo: string;
    subjectName: string;
  };
  processingTime: number;
  error?: string;
}

const API_KEY = process.env.ENGINE_3_API_KEY || '';
const API_BASE_URL = 'https://urlscan.io/api/v1';

// Rate limiting
let requestCount = 0;
let lastResetTime = Date.now();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

/**
 * Check if we're within rate limits
 */
function checkRateLimit(): boolean {
  const now = Date.now();
  
  // Reset counter if window has passed
  if (now - lastResetTime > RATE_LIMIT_WINDOW) {
    requestCount = 0;
    lastResetTime = now;
  }
  
  if (requestCount >= RATE_LIMIT_MAX) {
    return false;
  }
  
  requestCount++;
  return true;
}

/**
 * Submit URL for scanning
 */
async function submitScan(url: string): Promise<string> {
  const response = await axios.post(
    `${API_BASE_URL}/scan/`,
    {
      url,
      visibility: 'unlisted',
    },
    {
      headers: {
        'API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data.uuid;
}

/**
 * Get scan result
 */
async function getScanResult(uuid: string): Promise<any> {
  const response = await axios.get(
    `${API_BASE_URL}/result/${uuid}/`,
    {
      headers: {
        'API-Key': API_KEY,
      },
    }
  );
  
  return response.data;
}

/**
 * Calculate threat score based on verdict
 */
function calculateScore(verdictData: any): number {
  if (!verdictData) return 0;
  
  const overall = verdictData.overall;
  if (!overall) return 0;
  
  // If marked as malicious, high score
  if (overall.malicious === true) return 85;
  
  // Use verdict score if available
  if (overall.score !== undefined) {
    return Math.min(100, overall.score);
  }
  
  // Count risk indicators
  let riskScore = 0;
  
  if (overall.categories?.length > 0) riskScore += 30;
  if (overall.brands?.length > 0) riskScore += 25;
  if (overall.tags?.includes('phishing')) riskScore += 30;
  if (overall.tags?.includes('malware')) riskScore += 35;
  if (overall.tags?.includes('credential-harvesting')) riskScore += 30;
  
  return Math.min(100, riskScore);
}

/**
 * Parse verdict data
 */
function parseVerdict(data: any): Engine3Result['verdict'] {
  const overall = data.verdicts?.overall;
  
  if (!overall) {
    return {
      malicious: false,
      score: 0,
      categories: [],
      brands: [],
      tags: [],
    };
  }
  
  return {
    malicious: overall.malicious === true,
    score: overall.score || 0,
    categories: overall.categories || [],
    brands: overall.brands || [],
    tags: overall.tags || [],
  };
}

/**
 * Parse page information
 */
function parsePageInfo(data: any): Engine3Result['page'] {
  const page = data.page;
  
  if (!page) {
    return {
      url: data.task?.url || '',
      domain: '',
      ip: '',
      country: '',
      server: '',
      title: '',
    };
  }
  
  return {
    url: page.url,
    domain: page.domain,
    apexDomain: page.apexDomain,
    ip: page.ip,
    country: page.country,
    city: page.city,
    asn: page.asn,
    asnname: page.asnname,
    server: page.server,
    title: page.title || '',
    umbrellaRank: page.umbrellaRank,
  };
}

/**
 * Parse statistics
 */
function parseStats(data: any): Engine3Result['stats'] {
  const stats = data.stats;
  
  if (!stats) {
    return {
      requests: 0,
      ips: 0,
      countries: 0,
      domains: 0,
      dataLength: 0,
    };
  }
  
  return {
    requests: stats.resourceStats?.length || 0,
    ips: stats.uniqIPs || 0,
    countries: stats.uniqCountries || 0,
    domains: stats.malicious || 0,
    dataLength: stats.dataLength || 0,
  };
}

/**
 * Parse network lists
 */
function parseNetwork(data: any): Engine3Result['network'] {
  const lists = data.lists;
  
  if (!lists) {
    return {
      ips: [],
      domains: [],
      urls: [],
      servers: [],
    };
  }
  
  return {
    ips: lists.ips || [],
    domains: lists.domains || [],
    urls: lists.urls || [],
    servers: lists.servers || [],
  };
}

/**
 * Parse DOM analysis
 */
function parseDOM(data: any): Engine3Result['dom'] {
  const dom = data.data?.requests || [];
  
  const scripts: any[] = [];
  const iframes: any[] = [];
  const forms: any[] = [];
  
  // Extract from page data if available
  if (data.data?.console) {
    // Parse console logs for scripts
  }
  
  return {
    scripts: scripts.slice(0, 20), // Limit to 20
    iframes: iframes.slice(0, 10),
    forms: forms.slice(0, 5),
  };
}

/**
 * Parse certificate data
 */
function parseCertificate(data: any): Engine3Result['certificate'] | undefined {
  const cert = data.page?.tlsIssuer;
  
  if (!cert) return undefined;
  
  return {
    issuer: cert,
    validFrom: data.page?.tlsValidFrom || '',
    validTo: data.page?.tlsValidTo || '',
    subjectName: data.page?.domain || '',
  };
}

/**
 * Run Engine 3 analysis on a URL
 */
export async function analyzeURL(url: string): Promise<Engine3Result> {
  const startTime = Date.now();

  try {
    // Check if API key is configured
    if (!API_KEY) {
      return {
        available: false,
        processingTime: Date.now() - startTime,
        error: 'Engine 3 API key not configured',
      };
    }

    // Check rate limit
    if (!checkRateLimit()) {
      return {
        available: false,
        processingTime: Date.now() - startTime,
        error: 'Rate limit exceeded (10 requests/minute)',
      };
    }

    // Submit scan
    const uuid = await submitScan(url);

    // Wait for scan to complete (max 30 seconds)
    let attempts = 0;
    let result;
    
    while (attempts < 6) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
        result = await getScanResult(uuid);
        break;
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Scan still in progress
          attempts++;
          continue;
        }
        throw error;
      }
    }

    if (!result) {
      return {
        available: true,
        detected: false,
        processingTime: Date.now() - startTime,
        error: 'Scan timeout - analysis taking longer than expected',
      };
    }

    // Parse results
    const verdict = parseVerdict(result);
    const score = calculateScore(result.verdicts);
    const page = parsePageInfo(result);
    const stats = parseStats(result);
    const network = parseNetwork(result);
    const dom = parseDOM(result);
    const certificate = parseCertificate(result);

    const processingTime = Date.now() - startTime;

    return {
      available: true,
      detected: verdict?.malicious || false,
      score,
      task: {
        uuid,
        reportURL: `https://urlscan.io/result/${uuid}/`,
        screenshotURL: `https://urlscan.io/screenshots/${uuid}.png`,
        time: new Date(result.task?.time || Date.now()),
      },
      verdict,
      page,
      stats,
      network,
      dom,
      certificate,
      processingTime,
    };
  } catch (error: any) {
    console.error('Engine 3 error:', error.message);
    
    return {
      available: false,
      processingTime: Date.now() - startTime,
      error: error.message || 'Engine 3 analysis failed',
    };
  }
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus() {
  const now = Date.now();
  const timeUntilReset = RATE_LIMIT_WINDOW - (now - lastResetTime);
  
  return {
    remaining: Math.max(0, RATE_LIMIT_MAX - requestCount),
    limit: RATE_LIMIT_MAX,
    resetIn: Math.max(0, timeUntilReset),
  };
}
