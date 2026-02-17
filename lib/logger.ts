import mongoose from "mongoose";
import Log, { LogLevel } from "./models/Log";

export interface LogOptions {
  level?: LogLevel;
  action: string;
  details: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// create a log entry in database
// returns the log id or empty string if it fails
export async function createLog(options: LogOptions): Promise<string> {
  try {
    // Only attempt to log to database if mongoose is already connected
    // This prevents circular dependency issues during initial connection
    if (mongoose.connection.readyState !== 1) {
      // Not connected yet, skip database logging
      return "";
    }

    const logEntry = await Log.create({
      level: options.level || "info",
      action: options.action,
      details: options.details,
      userId: options.userId,
      userName: options.userName,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      metadata: options.metadata || {},
      timestamp: new Date(),
    });

    return (logEntry._id as any).toString();
  } catch (error) {
    // Silently fail to prevent logging from breaking the app
    // Only log to console in verbose mode
    if (process.env.VERBOSE_LOGS === 'true') {
      console.error("Failed to create log entry:", error);
    }
    return "";
  }
}

// log an info level event
export async function logInfo(
  action: string,
  details: string,
  options?: Partial<LogOptions>
): Promise<void> {
  await createLog({
    level: "info",
    action,
    details,
    ...options,
  });
}

// log a warning event
export async function logWarning(
  action: string,
  details: string,
  options?: Partial<LogOptions>
): Promise<void> {
  await createLog({
    level: "warning",
    action,
    details,
    ...options,
  });
}

// log an error event
export async function logError(
  action: string,
  details: string,
  options?: Partial<LogOptions>
): Promise<void> {
  await createLog({
    level: "error",
    action,
    details,
    ...options,
  });
}

// log a critical event (oh no!)
export async function logCritical(
  action: string,
  details: string,
  options?: Partial<LogOptions>
): Promise<void> {
  await createLog({
    level: "critical",
    action,
    details,
    ...options,
  });
}

// helper to get client ip from headers
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

// helper to get user agent from headers
export function getUserAgent(headers: Headers): string {
  return headers.get("user-agent") || "unknown";
}

// create a log from a nextjs request
// automatically grabs ip and user agent
export async function logFromRequest(
  request: Request,
  action: string,
  details: string,
  options?: Partial<LogOptions>
): Promise<void> {
  await createLog({
    action,
    details,
    ipAddress: getClientIp(request.headers),
    userAgent: getUserAgent(request.headers),
    ...options,
  });
}

// ===== CONSOLE-STYLE LOGGER =====
// Logs to both console (for immediate feedback) and database (for audit trail)
// Use these in API routes and lib files for better debugging and monitoring

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log info message (console + database)
   * Use for general information and successful operations
   */
  info: (message: string, metadata?: Record<string, any>) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, metadata || '');
    }
    // Fire and forget - don't await to prevent blocking
    logInfo('system', message, { metadata }).catch(() => {});
  },

  /**
   * Log warning message (console + database)
   * Use for non-critical issues or deprecated features
   */
  warn: (message: string, metadata?: Record<string, any>) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, metadata || '');
    }
    logWarning('system', message, { metadata }).catch(() => {});
  },

  /**
   * Log error message (console + database)
   * Use for errors that should be investigated
   */
  error: (message: string, error?: Error | unknown, metadata?: Record<string, any>) => {
    const errorDetails = error instanceof Error ? error.message : String(error);
    const fullMessage = error ? `${message}: ${errorDetails}` : message;
    
    console.error(`[ERROR] ${fullMessage}`, metadata || '');
    
    logError('system', fullMessage, { 
      metadata: { 
        ...metadata, 
        stack: error instanceof Error ? error.stack : undefined 
      } 
    }).catch(() => {});
  },

  /**
   * Log critical error message (console + database)
   * Use for critical failures that affect system stability
   */
  critical: (message: string, error?: Error | unknown, metadata?: Record<string, any>) => {
    const errorDetails = error instanceof Error ? error.message : String(error);
    const fullMessage = error ? `${message}: ${errorDetails}` : message;
    
    console.error(`[CRITICAL] ${fullMessage}`, metadata || '');
    
    logCritical('system', fullMessage, { 
      metadata: { 
        ...metadata, 
        stack: error instanceof Error ? error.stack : undefined 
      } 
    }).catch(() => {});
  },

  /**
   * Log debug message (console only in development)
   * Use for detailed debugging information
   */
  debug: (message: string, metadata?: Record<string, any>) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, metadata || '');
    }
  },
};
