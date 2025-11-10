import { NextRequest } from "next/server";
import { verifyAccessToken, extractBearerToken } from "@/lib/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import { ErrorResponses } from "@/lib/apiResponse";

/**
 * JWT Authentication Middleware
 * Supports both JWT tokens (for desktop) and NextAuth sessions (for web)
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isPremium: boolean;
  user: IUser;
}

/**
 * Authenticate request using JWT or NextAuth session
 * Returns user if authenticated, null otherwise
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<{ user: AuthenticatedUser | null; error?: any }> {
  await dbConnect();

  // Try JWT authentication first (for desktop client)
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const token = extractBearerToken(authHeader);
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        // Get full user details from database
        const user = await User.findById(payload.userId);
        if (user) {
          return {
            user: {
              id: String(user._id),
              email: user.email,
              name: user.name,
              role: user.role,
              isPremium: user.isPremium || false,
              user: user,
            },
          };
        }
      }
    }
  }

  // Fallback to NextAuth session (for web dashboard)
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const user = await User.findOne({ email: session.user.email });
    if (user) {
      return {
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
          isPremium: user.isPremium || false,
          user: user,
        },
      };
    }
  }

  return { user: null };
}

/**
 * Require authentication - returns user or throws error response
 */
export async function requireAuth(req: NextRequest): Promise<AuthenticatedUser> {
  const { user, error } = await authenticateRequest(req);

  if (!user) {
    throw ErrorResponses.unauthorized("Authentication required");
  }

  return user;
}

/**
 * Require specific role
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: string[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);

  if (!allowedRoles.includes(user.role)) {
    throw ErrorResponses.forbidden(
      `Access denied. Required role: ${allowedRoles.join(" or ")}`
    );
  }

  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin(req: NextRequest): Promise<AuthenticatedUser> {
  return requireRole(req, ["admin"]);
}

/**
 * Check if request is authenticated (doesn't throw)
 */
export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const { user } = await authenticateRequest(req);
  return user !== null;
}
