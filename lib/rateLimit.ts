import connectToDatabase from "./db";
import RateLimit from "./models/RateLimit";

export interface RateLimitConfig {
  endpoint: string;
  limit: number;
  windowMs?: number; // time window in ms, default 1 hour
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
  current: number;
}

// check and update rate limit for a user on specific endpoint
// returns whether the request is allowed and current stats
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  await connectToDatabase();

  const { endpoint, limit, windowMs = 3600000 } = config; // default 1 hour
  const now = new Date();

  // Use findOneAndUpdate with upsert to avoid duplicate key errors
  // This handles concurrent requests properly
  const rateLimitRecord = await RateLimit.findOneAndUpdate(
    { userId, endpoint },
    {
      $setOnInsert: {
        userId,
        endpoint,
        requestsCount: 0,
        windowStart: now,
        lastReset: now,
        violations: 0,
        limit,
      },
    },
    {
      upsert: true,
      new: false, // return original document
      runValidators: true,
    }
  );

  // If document was just created (rateLimitRecord is null), fetch it
  if (!rateLimitRecord) {
    const newRecord = await RateLimit.findOne({ userId, endpoint });
    if (newRecord) {
      newRecord.requestsCount = 1;
      await newRecord.save();
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: new Date(now.getTime() + windowMs),
        limit,
        current: 1,
      };
    }
  }

  // check if window expired
  const windowStart = rateLimitRecord.windowStart.getTime();
  const timeSinceWindowStart = now.getTime() - windowStart;

  if (timeSinceWindowStart >= windowMs) {
    // reset window
    rateLimitRecord.requestsCount = 1;
    rateLimitRecord.windowStart = now;
    rateLimitRecord.lastReset = now;
    await rateLimitRecord.save();

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now.getTime() + windowMs),
      limit,
      current: 1,
    };
  }

  // check if limit exceeded
  if (rateLimitRecord.requestsCount >= limit) {
    // increment violations counter
    rateLimitRecord.violations += 1;
    await rateLimitRecord.save();

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(windowStart + windowMs),
      limit,
      current: rateLimitRecord.requestsCount,
    };
  }

  // increment request count
  rateLimitRecord.requestsCount += 1;
  await rateLimitRecord.save();

  return {
    allowed: true,
    remaining: limit - rateLimitRecord.requestsCount,
    resetAt: new Date(windowStart + windowMs),
    limit,
    current: rateLimitRecord.requestsCount,
  };
}

// get current rate limit status without incrementing counter
// useful for checking status without affecting the limit
export async function getRateLimitStatus(
  userId: string,
  endpoint: string
): Promise<RateLimitResult | null> {
  await connectToDatabase();

  const rateLimitRecord = await RateLimit.findOne({ userId, endpoint });

  if (!rateLimitRecord) {
    return null;
  }

  const windowMs = 3600000; // 1 hour
  const windowStart = rateLimitRecord.windowStart.getTime();
  const now = Date.now();
  const timeSinceWindowStart = now - windowStart;

  // check if window expired
  if (timeSinceWindowStart >= windowMs) {
    return {
      allowed: true,
      remaining: rateLimitRecord.limit,
      resetAt: new Date(now + windowMs),
      limit: rateLimitRecord.limit,
      current: 0,
    };
  }

  return {
    allowed: rateLimitRecord.requestsCount < rateLimitRecord.limit,
    remaining: Math.max(0, rateLimitRecord.limit - rateLimitRecord.requestsCount),
    resetAt: new Date(windowStart + windowMs),
    limit: rateLimitRecord.limit,
    current: rateLimitRecord.requestsCount,
  };
}

// reset rate limit for a user
// can reset specific endpoint or all endpoints if not specified
export async function resetRateLimit(
  userId: string,
  endpoint?: string
): Promise<void> {
  await connectToDatabase();

  const now = new Date();
  const update = {
    $set: {
      requestsCount: 0,
      windowStart: now,
      lastReset: now,
    },
  };

  if (endpoint) {
    await RateLimit.findOneAndUpdate({ userId, endpoint }, update);
  } else {
    await RateLimit.updateMany({ userId }, update);
  }
}
