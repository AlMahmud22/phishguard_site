import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

/**
 * JWT Token Utilities for Desktop Client Authentication
 */

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: "access" | "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

// Get secrets from environment
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.NEXTAUTH_SECRET || "default-access-secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.NEXTAUTH_SECRET || "default-refresh-secret";
const JWT_ACCESS_EXPIRY = parseInt(process.env.JWT_ACCESS_EXPIRY || "3600", 10); // 1 hour
const JWT_REFRESH_EXPIRY = parseInt(process.env.JWT_REFRESH_EXPIRY || "2592000", 10); // 30 days

/**
 * Generate JWT access token
 */
export function generateAccessToken(userId: string, email: string, role: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    role,
    type: "access",
  };

  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY,
    issuer: "phishguard-api",
    audience: "phishguard-client",
  });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(userId: string, email: string, role: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    role,
    type: "refresh",
  };

  // Add random jti (JWT ID) for refresh token tracking
  const jti = randomBytes(16).toString("hex");

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
    jwtid: jti,
    issuer: "phishguard-api",
    audience: "phishguard-client",
  });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId: string, email: string, role: string): TokenPair {
  return {
    accessToken: generateAccessToken(userId, email, role),
    refreshToken: generateRefreshToken(userId, email, role),
    expiresIn: JWT_ACCESS_EXPIRY,
    refreshExpiresIn: JWT_REFRESH_EXPIRY,
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: "phishguard-api",
      audience: "phishguard-client",
    }) as JWTPayload;

    if (payload.type !== "access") {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: "phishguard-api",
      audience: "phishguard-client",
    }) as JWTPayload;

    if (payload.type !== "refresh") {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}
