/**
 * One-Time Code Generator for Desktop OAuth Flow
 * Generates, stores, and validates one-time codes for secure desktop authentication
 * Uses MongoDB for persistent storage to work across multiple server instances
 */

import { randomBytes } from "crypto";
import dbConnect from "./db";
import OneTimeCode from "./models/OneTimeCode";

/**
 * Configuration
 */
const CODE_LENGTH = 32; // Length of the code in bytes (64 hex characters)
const CODE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes (increased for manual code entry)

/**
 * Generate a cryptographically secure one-time code
 * @param userId - User ID
 * @param email - User email
 * @param role - User role
 * @returns The generated code
 */
export async function generateOneTimeCode(
  userId: string,
  email: string,
  role: string
): Promise<string> {
  try {
    console.log(`[OneTimeCode] Connecting to database...`);
    await dbConnect();
    console.log(`[OneTimeCode] Database connected`);

    // Generate random code
    const code = randomBytes(CODE_LENGTH).toString("hex");
    console.log(`[OneTimeCode] Generated code: ${code.substring(0, 8)}...`);

    // Store code in database
    const now = Date.now();
    const expiresAt = new Date(now + CODE_EXPIRY_MS);

    console.log(`[OneTimeCode] Saving code to database for user ${email}`);
    const savedCode = await OneTimeCode.create({
      code,
      userId,
      email,
      role,
      createdAt: new Date(now),
      expiresAt,
      consumed: false,
    });

    console.log(`[OneTimeCode] Code saved successfully with ID: ${savedCode._id}`);
    console.log(`[OneTimeCode] Generated code for user ${email}, expires in ${CODE_EXPIRY_MS / 1000}s`);

    return code;
  } catch (error) {
    console.error(`[OneTimeCode] Error generating code:`, error);
    throw error;
  }
}

/**
 * Validate and consume a one-time code
 * @param code - The code to validate
 * @returns User data if valid, null if invalid/expired/consumed
 */
export async function validateAndConsumeCode(code: string): Promise<{
  userId: string;
  email: string;
  role: string;
} | null> {
  await dbConnect();

  console.log(`[OneTimeCode] Validating code: ${code.substring(0, 8)}... (length: ${code.length})`);

  // Find the code in database
  const data = await OneTimeCode.findOne({ code });

  if (!data) {
    const totalCodes = await OneTimeCode.countDocuments();
    console.log(`[OneTimeCode] Code not found in database`);
    console.log(`[OneTimeCode] Total codes in DB: ${totalCodes}`);
    return null;
  }

  const now = Date.now();
  const ageSeconds = Math.floor((now - data.createdAt.getTime()) / 1000);
  const expiresInSeconds = Math.floor((data.expiresAt.getTime() - now) / 1000);

  console.log(`[OneTimeCode] Code found for user ${data.email}`);
  console.log(`[OneTimeCode] Code age: ${ageSeconds}s, expires in: ${expiresInSeconds}s`);
  console.log(`[OneTimeCode] Code consumed: ${data.consumed}`);

  // Check if expired
  if (now > data.expiresAt.getTime()) {
    console.log(`[OneTimeCode] Code expired for user ${data.email}`);
    await OneTimeCode.deleteOne({ code });
    return null;
  }

  // Check if already consumed
  if (data.consumed) {
    console.log(`[OneTimeCode] Code already consumed for user ${data.email}`);
    return null;
  }

  // Mark as consumed
  data.consumed = true;
  await data.save();

  // Delete after use
  setTimeout(async () => {
    await OneTimeCode.deleteOne({ code }).catch(err => 
      console.error('[OneTimeCode] Error deleting consumed code:', err)
    );
  }, 1000);

  console.log(`[OneTimeCode] Code validated and consumed successfully for user ${data.email}`);

  return {
    userId: data.userId,
    email: data.email,
    role: data.role,
  };
}

/**
 * Get information about a code without consuming it (for debugging)
 * @param code - The code to check
 * @returns Code information or null
 */
export async function getCodeInfo(code: string) {
  await dbConnect();
  return await OneTimeCode.findOne({ code });
}

/**
 * Clean up expired codes from database
 */
export async function cleanupExpiredCodes(): Promise<number> {
  await dbConnect();
  const now = new Date();
  const result = await OneTimeCode.deleteMany({ expiresAt: { $lt: now } });
  
  if (result.deletedCount > 0) {
    console.log(`[OneTimeCode] Cleaned up ${result.deletedCount} expired codes`);
  }

  return result.deletedCount;
}

/**
 * Get current store size (for monitoring)
 */
export async function getStoreSize(): Promise<number> {
  await dbConnect();
  return await OneTimeCode.countDocuments();
}
