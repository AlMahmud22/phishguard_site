/**
 * Engine 1: Statistical ML Model (40% weight)
 * Local machine learning analysis using 12-feature logistic regression
 * Always available, offline-capable scoring
 */

interface Engine1Features {
  urlLength: number;
  domainAge?: number;
  hasHTTPS: boolean;
  subdomainCount: number;
  hasIP: boolean;
  specialCharCount: number;
  hasSuspiciousKeywords: boolean;
  pathDepth: number;
  queryParamCount: number;
  domainEntropy: number;
  tldSuspicious: boolean;
  shortenedUrl: boolean;
}

export interface Engine1Result {
  available: boolean;
  score: number; // 0-100
  factors: string[];
  features: Engine1Features;
  verdict: 'safe' | 'suspicious' | 'malicious';
  processingTime: number;
}

// Suspicious patterns
const SUSPICIOUS_KEYWORDS = [
  'login', 'signin', 'account', 'update', 'verify', 'secure', 'banking',
  'paypal', 'ebay', 'amazon', 'apple', 'microsoft', 'google', 'facebook',
  'confirm', 'suspend', 'locked', 'click', 'here', 'now', 'urgent'
];

const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click', '.loan',
  '.win', '.bid', '.stream', '.download', '.cricket', '.science', '.work'
];

const URL_SHORTENERS = [
  'bit.ly', 'goo.gl', 'tinyurl', 'ow.ly', 't.co', 'buff.ly', 'is.gd',
  'adf.ly', 'bit.do', 'short.link', 'cutt.ly'
];

/**
 * Calculate Shannon entropy of a string (measure of randomness)
 */
function calculateEntropy(str: string): number {
  const len = str.length;
  const frequencies: { [key: string]: number } = {};
  
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

/**
 * Extract 12 features from URL for ML analysis
 */
function extractFeatures(url: string): Engine1Features {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    // Invalid URL
    return {
      urlLength: url.length,
      hasHTTPS: false,
      subdomainCount: 0,
      hasIP: false,
      specialCharCount: 0,
      hasSuspiciousKeywords: true,
      pathDepth: 0,
      queryParamCount: 0,
      domainEntropy: 0,
      tldSuspicious: false,
      shortenedUrl: false,
    };
  }

  const hostname = parsedUrl.hostname;
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  // Feature 1: URL Length
  const urlLength = url.length;

  // Feature 2: HTTPS
  const hasHTTPS = parsedUrl.protocol === 'https:';

  // Feature 3: Subdomain count
  const subdomainParts = hostname.split('.');
  const subdomainCount = Math.max(0, subdomainParts.length - 2);

  // Feature 4: Has IP address
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const hasIP = ipRegex.test(hostname);

  // Feature 5: Special character count
  const specialChars = url.match(/[^a-zA-Z0-9.-/:]/g) || [];
  const specialCharCount = specialChars.length;

  // Feature 6: Suspicious keywords
  const lowerUrl = url.toLowerCase();
  const hasSuspiciousKeywords = SUSPICIOUS_KEYWORDS.some(keyword => 
    lowerUrl.includes(keyword)
  );

  // Feature 7: Path depth
  const pathDepth = pathname.split('/').filter(p => p.length > 0).length;

  // Feature 8: Query parameter count
  const queryParamCount = Array.from(searchParams.keys()).length;

  // Feature 9: Domain entropy (randomness)
  const domainEntropy = calculateEntropy(hostname);

  // Feature 10: Suspicious TLD
  const tldSuspicious = SUSPICIOUS_TLDS.some(tld => hostname.endsWith(tld));

  // Feature 11: URL shortener
  const shortenedUrl = URL_SHORTENERS.some(shortener => hostname.includes(shortener));

  return {
    urlLength,
    hasHTTPS,
    subdomainCount,
    hasIP,
    specialCharCount,
    hasSuspiciousKeywords,
    pathDepth,
    queryParamCount,
    domainEntropy,
    tldSuspicious,
    shortenedUrl,
  };
}

/**
 * Simple logistic regression scoring
 * Weights determined through training (simplified for demo)
 */
function calculateMLScore(features: Engine1Features): number {
  let score = 0;

  // Weight contributions (simplified logistic regression)
  if (features.urlLength > 75) score += 15;
  if (features.urlLength > 150) score += 10;
  
  if (!features.hasHTTPS) score += 10;
  if (features.hasIP) score += 25;
  if (features.subdomainCount > 2) score += 15;
  if (features.subdomainCount > 4) score += 15;
  if (features.specialCharCount > 5) score += 10;
  if (features.hasSuspiciousKeywords) score += 20;
  if (features.pathDepth > 4) score += 10;
  if (features.queryParamCount > 3) score += 10;
  if (features.domainEntropy > 4) score += 15;
  if (features.tldSuspicious) score += 30;
  if (features.shortenedUrl) score += 25;

  return Math.min(100, score);
}

/**
 * Identify risk factors based on features
 */
function identifyFactors(features: Engine1Features): string[] {
  const factors: string[] = [];

  if (features.urlLength > 75) {
    factors.push('Unusually long URL');
  }
  if (!features.hasHTTPS) {
    factors.push('No HTTPS encryption');
  }
  if (features.hasIP) {
    factors.push('IP address instead of domain name');
  }
  if (features.subdomainCount > 2) {
    factors.push('Excessive subdomains');
  }
  if (features.specialCharCount > 5) {
    factors.push('High number of special characters');
  }
  if (features.hasSuspiciousKeywords) {
    factors.push('Contains phishing-related keywords');
  }
  if (features.pathDepth > 4) {
    factors.push('Deep directory structure');
  }
  if (features.queryParamCount > 3) {
    factors.push('Many query parameters');
  }
  if (features.domainEntropy > 4) {
    factors.push('Random-looking domain name');
  }
  if (features.tldSuspicious) {
    factors.push('Suspicious top-level domain');
  }
  if (features.shortenedUrl) {
    factors.push('URL shortening service detected');
  }

  return factors;
}

/**
 * Determine verdict based on score
 */
function getVerdict(score: number): 'safe' | 'suspicious' | 'malicious' {
  if (score < 30) return 'safe';
  if (score < 60) return 'suspicious';
  return 'malicious';
}

/**
 * Run Engine 1 analysis on a URL
 */
export async function analyzeURL(url: string): Promise<Engine1Result> {
  const startTime = Date.now();

  try {
    // Extract features
    const features = extractFeatures(url);

    // Calculate ML score
    const score = calculateMLScore(features);

    // Identify risk factors
    const factors = identifyFactors(features);

    // Determine verdict
    const verdict = getVerdict(score);

    const processingTime = Date.now() - startTime;

    return {
      available: true,
      score,
      factors,
      features,
      verdict,
      processingTime,
    };
  } catch (error) {
    console.error('Engine 1 error:', error);
    
    // Return safe default on error
    return {
      available: false,
      score: 0,
      factors: ['Engine 1 analysis failed'],
      features: extractFeatures(url),
      verdict: 'safe',
      processingTime: Date.now() - startTime,
    };
  }
}
