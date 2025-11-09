/// TypeScript type definitions for PhishGuard entities

/// User account information
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/// Authentication response from API
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

/// URL scan result from phishing detection
export interface ScanResult {
  id: string;
  url: string;
  isPhishing: boolean;
  confidence: number;
  scanDate: string;
  userId: string;
  details?: {
    suspiciousPatterns?: string[];
    domainAge?: number;
    sslStatus?: string;
  };
}

/// Analytics data for dashboard
export interface AnalyticsData {
  totalScans: number;
  phishingDetected: number;
  safeUrls: number;
  recentScans: ScanResult[];
}

/// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

/// Registration data
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
