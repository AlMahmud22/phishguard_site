import { NextResponse } from "next/server";

/**
 * Standardized Error Response Utility
 */

export type ErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR"
  | "VALIDATION_ERROR"
  | "DUPLICATE_ENTRY"
  | "RESOURCE_EXHAUSTED";

export interface APIError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  message?: string;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, any>,
  statusCode?: number
): NextResponse<APIResponse> {
  const status = statusCode || getStatusCode(code);

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<APIResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: statusCode }
  );
}

/**
 * Get HTTP status code from error code
 */
function getStatusCode(code: ErrorCode): number {
  const statusMap: Record<ErrorCode, number> = {
    INVALID_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    RATE_LIMIT_EXCEEDED: 429,
    INTERNAL_ERROR: 500,
    VALIDATION_ERROR: 400,
    DUPLICATE_ENTRY: 409,
    RESOURCE_EXHAUSTED: 429,
  };

  return statusMap[code] || 500;
}

/**
 * Pre-defined error responses
 */
export const ErrorResponses = {
  invalidRequest: (message: string = "Invalid request parameters", details?: Record<string, any>) =>
    createErrorResponse("INVALID_REQUEST", message, details),

  unauthorized: (message: string = "Authentication required", details?: Record<string, any>) =>
    createErrorResponse("UNAUTHORIZED", message, details),

  forbidden: (message: string = "Access denied", details?: Record<string, any>) =>
    createErrorResponse("FORBIDDEN", message, details),

  notFound: (message: string = "Resource not found", details?: Record<string, any>) =>
    createErrorResponse("NOT_FOUND", message, details),

  rateLimitExceeded: (message: string = "Rate limit exceeded", details?: Record<string, any>) =>
    createErrorResponse("RATE_LIMIT_EXCEEDED", message, details),

  internalError: (message: string = "Internal server error", details?: Record<string, any>) =>
    createErrorResponse("INTERNAL_ERROR", message, details),

  validationError: (message: string = "Validation failed", details?: Record<string, any>) =>
    createErrorResponse("VALIDATION_ERROR", message, details),

  duplicateEntry: (message: string = "Resource already exists", details?: Record<string, any>) =>
    createErrorResponse("DUPLICATE_ENTRY", message, details),

  resourceExhausted: (message: string = "Resource limit exceeded", details?: Record<string, any>) =>
    createErrorResponse("RESOURCE_EXHAUSTED", message, details),
};

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: Date
): NextResponse {
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", Math.floor(reset.getTime() / 1000).toString());
  return response;
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}
