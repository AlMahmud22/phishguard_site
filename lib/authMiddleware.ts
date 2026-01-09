import { NextRequest } from "next/server";
import { verifyAccessToken, extractBearerToken } from "@/lib/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import { ErrorResponses } from "@/lib/apiResponse";
import bcrypt from 'bcryptjs';

/**
 * JWT Authentication Middleware
 * Supports JWT tokens, desktop app keys, and NextAuth sessions
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isPremium: boolean;
  user: IUser;
  authType?: 'jwt' | 'desktop-key' | 'session';
}

/**
 * Authenticate request using desktop app key
 */
async function authenticateWithDesktopKey(
  key: string
): Promise<{ user: AuthenticatedUser | null; error?: any }> {
  // Desktop keys have format: pgd_{userId}_{random}
  if (!key.startsWith('pgd_')) {
    return { user: null };
  }
  
  try {
    // Extract user ID prefix from key
    const parts = key.split('_');
    if (parts.length !== 3) {
      return { user: null };
    }
    
    const userIdPrefix = parts[1];
    
    // Find users whose ID starts with this prefix
    const users = await User.find({
      _id: { $regex: `^${userIdPrefix}` },
      'desktopAppKeys.isActive': true
    });
    
    // Check each user's keys
    for (const user of users) {
      if (!user.desktopAppKeys) continue;
      
      for (const keyData of user.desktopAppKeys) {
        if (!keyData.isActive) continue;
        
        // Verify the key
        const isValid = await bcrypt.compare(key, keyData.key);
        if (isValid) {
          // Update last used timestamp
          keyData.lastUsed = new Date();
          await user.save();
          
          return {
            user: {
              id: String(user._id),
              email: user.email,
              name: user.name,
              role: user.role,
              isPremium: user.isPremium || false,
              user: user,
              authType: 'desktop-key'
            }
          };
        }
      }
    }
  } catch (error) {
    console.error('Desktop key authentication error:', error);
  }
  
  return { user: null };
}

/**
 * Authenticate request using JWT or desktop key or NextAuth session
 * Returns user if authenticated, null otherwise
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<{ user: AuthenticatedUser | null; error?: any }> {
  await dbConnect();

  // Check for desktop app key first (X-Desktop-Key header)
  const desktopKey = req.headers.get("x-desktop-key");
  if (desktopKey) {
    const result = await authenticateWithDesktopKey(desktopKey);
    if (result.user) {
      return result;
    }
  }

  // Try JWT authentication (for desktop client with JWT)
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
              authType: 'jwt'
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
          authType: 'session'
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
