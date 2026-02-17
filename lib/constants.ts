/**
 * Application-wide constants for PhishGuard
 * Centralized configuration for limits, timeouts, and thresholds
 */

// ===== API RATE LIMITS =====
export const RATE_LIMITS = {
  // Free user limits
  FREE: {
    HOURLY: 100,
    DAILY: 500,
    MONTHLY: 5000,
  },
  // Premium user limits
  PREMIUM: {
    HOURLY: 1000,
    DAILY: 10000,
    MONTHLY: 100000,
  },
  // Batch processing limits
  MAX_BATCH_SIZE: 50,
  MAX_CONCURRENT_SCANS: 5,
};

// ===== EXTERNAL API TIMEOUTS (milliseconds) =====
export const API_TIMEOUTS = {
  VIRUSTOTAL: 6000,
  URLSCAN_SUBMIT: 5000,
  URLSCAN_RESULT: 10000,
  DEFAULT: 5000,
};

// ===== SCAN SCORE THRESHOLDS =====
export const SCORE_THRESHOLDS = {
  DANGER: 70,    // >= 70 = danger
  WARNING: 40,   // >= 40 = warning
  SAFE: 0,       // < 40 = safe
};

// ===== SCORE WEIGHTS (for cloud score calculation) =====
export const SCORE_WEIGHTS = {
  DOMAIN_REPUTATION: 0.30,
  SECURITY_FEATURES: 0.20,
  CONTENT_ANALYSIS: 0.25,
  THREAT_DATABASES: 0.25,
};

// ===== INPUT VALIDATION =====
export const INPUT_LIMITS = {
  MAX_USER_AGENT_LENGTH: 500,
  MAX_URL_LENGTH: 2048,
  MAX_SCAN_FACTORS: 50,
};

// ===== CONTEXT TYPES =====
export const SCAN_CONTEXTS = ['clipboard', 'manual', 'browser'] as const;
export type ScanContext = typeof SCAN_CONTEXTS[number];

// ===== USER ROLES =====
export const USER_ROLES = ['user', 'tester', 'admin'] as const;
export type UserRole = typeof USER_ROLES[number];

// ===== AUTH PROVIDERS =====
export const AUTH_PROVIDERS = ['credentials', 'google', 'github'] as const;
export type AuthProvider = typeof AUTH_PROVIDERS[number];

// ===== SCAN STATUSES =====
export const SCAN_STATUSES = ['safe', 'warning', 'danger'] as const;
export type ScanStatus = typeof SCAN_STATUSES[number];

// ===== LOG LEVELS =====
export const LOG_LEVELS = ['info', 'warning', 'error', 'critical'] as const;
export type LogLevel = typeof LOG_LEVELS[number];

// ===== DATABASE SETTINGS =====
export const DB_CONFIG = {
  MAX_POOL_SIZE: 10,
  MIN_POOL_SIZE: 2,
  SERVER_SELECTION_TIMEOUT_MS: 5000,
  SOCKET_TIMEOUT_MS: 45000,
};

// ===== PAGINATION DEFAULTS =====
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
};

// ===== FILE UPLOAD =====
export const FILE_UPLOAD = {
  MAX_SETUP_FILE_SIZE: 100 * 1024 * 1024, // 100 MB
  MAX_APP_FILE_SIZE: 500 * 1024 * 1024, // 500 MB
  ALLOWED_EXTENSIONS: ['.exe'],
  ALLOWED_MIME_TYPES: ['application/x-msdownload', 'application/octet-stream', 'application/x-msdos-program'],
  // PE (Portable Executable) file magic numbers for Windows executables
  PE_HEADER: {
    DOS_SIGNATURE: 0x5A4D, // "MZ" in hex
    PE_SIGNATURE: 0x4550,  // "PE" in hex
    PE_OFFSET_LOCATION: 0x3C, // Location of PE header offset in DOS header
  },
  // Filename validation
  MAX_FILENAME_LENGTH: 255,
  ALLOWED_VERSION_PATTERN: /^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$/, // SemVer format
};

// ===== TIME PERIODS =====
export const TIME_PERIODS = ['today', 'week', 'month', 'year', 'all'] as const;
export type TimePeriod = typeof TIME_PERIODS[number];

// ===== ENGINE NAMES =====
export const ENGINE_NAMES = {
  LOCAL: 'engine1',
  VIRUSTOTAL: 'engine2', 
  URLSCAN: 'engine3',
} as const;

export default {
  RATE_LIMITS,
  API_TIMEOUTS,
  SCORE_THRESHOLDS,
  SCORE_WEIGHTS,
  INPUT_LIMITS,
  SCAN_CONTEXTS,
  USER_ROLES,
  AUTH_PROVIDERS,
  SCAN_STATUSES,
  LOG_LEVELS,
  DB_CONFIG,
  PAGINATION,
  FILE_UPLOAD,
  TIME_PERIODS,
  ENGINE_NAMES,
};
