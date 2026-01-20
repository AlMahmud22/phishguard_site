/// TypeScript type definitions for PhishGuard entities

export type UserRole = "user" | "tester" | "admin";
export type AuthProvider = "credentials" | "google" | "github";

/// User account information
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider?: AuthProvider;
  providerId?: string;
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

/// User settings for preferences and configuration
export interface UserSettings {
  id: string;
  userId: string;
  theme: "light" | "dark" | "auto";
  notifications: {
    email: boolean;
    desktop: boolean;
    phishingAlerts: boolean;
  };
  language: string;
  timezone: string;
  updatedAt: string;
}

/// Statistics data for charts and analytics
export interface UserStats {
  totalScans: number;
  phishingDetected: number;
  safeUrls: number;
  scansByDate: {
    date: string;
    scans: number;
    phishing: number;
    safe: number;
  }[];
  topThreats: {
    url: string;
    count: number;
  }[];
  averageConfidence: number;
}

/// Scan history entry with full details
export interface ScanHistory {
  id: string;
  url: string;
  isPhishing: boolean;
  confidence: number;
  scanDate: string;
  userId: string;
  source: "desktop" | "web" | "api";
  details: {
    suspiciousPatterns?: string[];
    domainAge?: number;
    sslStatus?: string;
    ipAddress?: string;
  };
}

/// Admin - User management data
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: AuthProvider;
  accountStatus?: "pending" | "approved" | "rejected";
  isActive: boolean;
  totalScans: number;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

/// Admin - System log entry
export interface AdminLog {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "critical";
  action: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
  metadata?: Record<string, any>;
}

/// Admin - Rate limit statistics
export interface RateLimitData {
  userId?: string;
  endpoint: string;
  limit: number;
  current: number;
  remaining: number;
  resetAt: string;
  windowStart: string;
  violations: number;
}

/// Admin - Rate limit overview
export interface RateLimitOverview {
  totalRequests: number;
  blockedRequests: number;
  activeUsers: number;
  topEndpoints: {
    endpoint: string;
    requests: number;
    blocked: number;
  }[];
  recentViolations: {
    userId: string;
    userName: string;
    endpoint: string;
    timestamp: string;
  }[];
  configuration: {
    globalLimit: number;
    perUserLimit: number;
    windowMinutes: number;
  };
}

/// Admin - Activity metrics
export interface ActivityData {
  activeUsers: {
    current: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  scans: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byHour: {
      hour: string;
      count: number;
    }[];
  };
  threats: {
    detected: number;
    blocked: number;
    falsePositives: number;
    topDomains: {
      domain: string;
      count: number;
      lastSeen: string;
    }[];
  };
  system: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
  };
}

/// Admin - Users list response
export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/// Admin - Logs list response
export interface AdminLogsResponse {
  logs: AdminLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
