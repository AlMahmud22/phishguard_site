/**
 * Engine 2: Multi-Vendor Consensus (50% weight)
 * 70+ security vendor checks via external threat intelligence API
 * Rate limit: 4/min, 500/day
 */

import axios from 'axios';

export interface Engine2Vendor {
  vendor: string;
  category: 'malicious' | 'suspicious' | 'harmless' | 'undetected';
  result: string;
  method: string;
}

export interface Engine2Result {
  available: boolean;
  detected?: boolean;
  score?: number;
  engines?: {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
    total: number;
  };
  vendorResults?: Engine2Vendor[];
  metadata?: {
    httpResponseCode?: number;
    title?: string;
    reputation?: number;
    categories?: Array<{ vendor: string; category: string }>;
    trackers?: string[];
    serverHeaders?: Array<{ key: string; value: string }>;
    htmlMetaTags?: Array<{ name: string; content: string }>;
    redirectionChain?: string[];
    finalUrl?: string;
    lastAnalysisDate?: Date;
    timesSubmitted?: number;
  };
  processingTime: number;
  error?: string;
}

const API_KEY = process.env.ENGINE_2_API_KEY || '';
const API_BASE_URL = 'https://www.virustotal.com/api/v3';

// Rate limiting
let requestCount = 0;
let lastResetTime = Date.now();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 4;

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
 * Submit URL for analysis
 */
async function submitURL(url: string): Promise<string> {
  const response = await axios.post(
    `${API_BASE_URL}/urls`,
    new URLSearchParams({ url }),
    {
      headers: {
        'x-apikey': API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  
  return response.data.data.id;
}

/**
 * Get URL analysis report
 */
async function getURLReport(url: string): Promise<any> {
  const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
  
  const response = await axios.get(
    `${API_BASE_URL}/urls/${urlId}`,
    {
      headers: {
        'x-apikey': API_KEY,
      },
    }
  );
  
  return response.data.data;
}

/**
 * Parse vendor results from API response
 */
function parseVendorResults(lastAnalysisResults: any): Engine2Vendor[] {
  const vendors: Engine2Vendor[] = [];
  
  if (!lastAnalysisResults) return vendors;
  
  for (const [vendorName, result] of Object.entries(lastAnalysisResults)) {
    const vendorResult = result as any;
    vendors.push({
      vendor: vendorName,
      category: vendorResult.category || 'undetected',
      result: vendorResult.result || 'unrated',
      method: vendorResult.method || 'unknown',
    });
  }
  
  return vendors;
}

/**
 * Calculate score based on vendor consensus
 */
function calculateScore(engines: {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  total: number;
}): number {
  const { malicious, suspicious, total } = engines;
  
  if (total === 0) return 0;
  
  // Weight malicious higher than suspicious
  const weightedDetections = (malicious * 1.0) + (suspicious * 0.5);
  const score = (weightedDetections / total) * 100;
  
  return Math.round(Math.min(100, score));
}

/**
 * Parse metadata from API response
 */
function parseMetadata(attributes: any): Engine2Result['metadata'] {
  return {
    httpResponseCode: attributes.last_http_response_code,
    title: attributes.title,
    reputation: attributes.reputation,
    categories: attributes.categories 
      ? Object.entries(attributes.categories).map(([vendor, category]) => ({
          vendor,
          category: category as string,
        }))
      : [],
    trackers: attributes.trackers 
      ? Object.keys(attributes.trackers)
      : [],
    serverHeaders: attributes.last_http_response_headers 
      ? Object.entries(attributes.last_http_response_headers).map(([key, value]) => ({
          key,
          value: value as string,
        }))
      : [],
    htmlMetaTags: attributes.html_meta 
      ? Object.entries(attributes.html_meta).map(([name, content]) => ({
          name,
          content: Array.isArray(content) ? content.join(', ') : content as string,
        }))
      : [],
    redirectionChain: attributes.redirection_chain || [],
    finalUrl: attributes.last_final_url,
    lastAnalysisDate: attributes.last_analysis_date 
      ? new Date(attributes.last_analysis_date * 1000)
      : undefined,
    timesSubmitted: attributes.times_submitted,
  };
}

/**
 * Run Engine 2 analysis on a URL
 */
export async function analyzeURL(url: string): Promise<Engine2Result> {
  const startTime = Date.now();

  try {
    // Check if API key is configured
    if (!API_KEY) {
      return {
        available: false,
        processingTime: Date.now() - startTime,
        error: 'Engine 2 API key not configured',
      };
    }

    // Check rate limit
    if (!checkRateLimit()) {
      return {
        available: false,
        processingTime: Date.now() - startTime,
        error: 'Rate limit exceeded (4 requests/minute)',
      };
    }

    // Get URL report (or submit if not analyzed yet)
    let reportData;
    try {
      reportData = await getURLReport(url);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // URL not analyzed yet, submit it
        await submitURL(url);
        
        // Wait a bit for analysis
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try to get report again
        try {
          reportData = await getURLReport(url);
        } catch {
          return {
            available: true,
            detected: false,
            processingTime: Date.now() - startTime,
            error: 'URL analysis in progress, try again later',
          };
        }
      } else {
        throw error;
      }
    }

    const attributes = reportData.attributes;
    const lastAnalysisStats = attributes.last_analysis_stats;

    // Parse engine statistics
    const engines = {
      malicious: lastAnalysisStats.malicious || 0,
      suspicious: lastAnalysisStats.suspicious || 0,
      harmless: lastAnalysisStats.harmless || 0,
      undetected: lastAnalysisStats.undetected || 0,
      total: 
        (lastAnalysisStats.malicious || 0) +
        (lastAnalysisStats.suspicious || 0) +
        (lastAnalysisStats.harmless || 0) +
        (lastAnalysisStats.undetected || 0),
    };

    // Parse vendor results
    const vendorResults = parseVendorResults(attributes.last_analysis_results);

    // Calculate score
    const score = calculateScore(engines);

    // Parse metadata
    const metadata = parseMetadata(attributes);

    const processingTime = Date.now() - startTime;

    return {
      available: true,
      detected: engines.malicious > 0 || engines.suspicious > 0,
      score,
      engines,
      vendorResults,
      metadata,
      processingTime,
    };
  } catch (error: any) {
    console.error('Engine 2 error:', error.message);
    
    return {
      available: false,
      processingTime: Date.now() - startTime,
      error: error.message || 'Engine 2 analysis failed',
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
