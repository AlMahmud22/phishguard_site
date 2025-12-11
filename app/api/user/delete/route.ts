import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authMiddleware";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import Scan from "@/lib/models/Scan";
import Log from "@/lib/models/Log";
import { logInfo, logWarning, getClientIp, getUserAgent } from "@/lib/logger";
import { sendAccountDeletionEmail } from "@/lib/email";
import { createSuccessResponse, ErrorResponses } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request.headers);
  const userAgent = getUserAgent(request.headers);

  try {
    // Check authentication (supports JWT and NextAuth)
    const authUser = await requireAuth(request);

    const { password, confirmText } = await request.json();

    // Require confirmation text
    if (confirmText !== "DELETE MY ACCOUNT") {
      return ErrorResponses.invalidRequest(
        'Please type "DELETE MY ACCOUNT" to confirm'
      );
    }

    await connectToDatabase();

    const user = await User.findById(authUser.id);

    if (!user) {
      return ErrorResponses.notFound("User not found");
    }

    // For credentials users, verify password
    if (user.provider === "credentials") {
      if (!password) {
        return ErrorResponses.invalidRequest(
          "Password is required to delete account"
        );
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash || '');
      
      if (!isValidPassword) {
        await logWarning(
          "Account Deletion Failed",
          "Invalid password",
          { 
            userId: authUser.id, 
            userName: user.name,
            ipAddress, 
            userAgent 
          }
        );
        return ErrorResponses.invalidRequest("Invalid password");
      }
    }

    const userEmail = user.email;
    const userName = user.name;
    const userId = (user._id as any).toString();

    // Delete all user data
    await Promise.all([
      User.deleteOne({ _id: user._id }),
      Scan.deleteMany({ userId: user._id }),
      Log.deleteMany({ userId: user._id }),
    ]);

    // Send deletion confirmation email
    await sendAccountDeletionEmail(userEmail, userName);

    await logInfo(
      "Account Deleted",
      `User account permanently deleted: ${userEmail}`,
      {
        userId,
        userName,
        ipAddress,
        userAgent,
        metadata: { 
          email: userEmail, 
          provider: user.provider,
          scansDeleted: true,
          logsDeleted: true,
        },
      }
    );

    return createSuccessResponse(
      {},
      "Your account has been permanently deleted. We're sorry to see you go."
    );
  } catch (error: any) {
    console.error("Account deletion error:", error);
    return ErrorResponses.internalError("Failed to delete account");
  }
}
