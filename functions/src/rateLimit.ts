import * as admin from 'firebase-admin';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 30, // 30 requests
  windowMs: 60 * 1000, // per minute
};

const DAILY_CONFIG: RateLimitConfig = {
  maxRequests: 200, // 200 requests
  windowMs: 24 * 60 * 60 * 1000, // per day
};

/**
 * Get client identifier (IP address or session ID)
 */
function getClientId(req: { ip?: string; headers: Record<string, string | string[] | undefined> }): string {
  // Try to get IP from various headers (for proxied requests)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim() 
    : req.ip || 'unknown';
  
  return ip;
}

/**
 * Check rate limit for a client
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
export async function checkRateLimit(
  req: { ip?: string; headers: Record<string, string | string[] | undefined> },
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const clientId = getClientId(req);
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  const rateLimitKey = `ratelimit:${clientId}:${Math.floor(now / config.windowMs)}`;
  
  try {
    const db = admin.firestore();
    const ref = db.collection('_rateLimits').doc(rateLimitKey);
    
    const doc = await ref.get();
    const data = doc.data();
    const count = data?.count || 0;
    const resetAt = (Math.floor(now / config.windowMs) + 1) * config.windowMs;
    
    if (count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }
    
    // Increment counter
    await ref.set({
      count: admin.firestore.FieldValue.increment(1),
      clientId,
      windowStart: admin.firestore.Timestamp.fromMillis(windowStart),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    return {
      allowed: true,
      remaining: config.maxRequests - count - 1,
      resetAt,
    };
  } catch (error) {
    // On error, allow the request (fail open)
    console.error('Rate limit check failed:', error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }
}

/**
 * Check both per-minute and daily rate limits
 */
export async function checkRateLimits(
  req: { ip?: string; headers: Record<string, string | string[] | undefined> }
): Promise<{ allowed: boolean; remaining: number; resetAt: number; reason?: string }> {
  // Check per-minute limit
  const minuteLimit = await checkRateLimit(req, DEFAULT_CONFIG);
  if (!minuteLimit.allowed) {
    return {
      ...minuteLimit,
      reason: 'Rate limit exceeded: too many requests per minute',
    };
  }
  
  // Check daily limit
  const dailyLimit = await checkRateLimit(req, DAILY_CONFIG);
  if (!dailyLimit.allowed) {
    return {
      ...dailyLimit,
      reason: 'Rate limit exceeded: too many requests per day',
    };
  }
  
  // Return the more restrictive remaining count
  return {
    allowed: true,
    remaining: Math.min(minuteLimit.remaining, dailyLimit.remaining),
    resetAt: Math.min(minuteLimit.resetAt, dailyLimit.resetAt),
  };
}

/**
 * Cleanup old rate limit entries (call periodically via scheduled function)
 */
export async function cleanupRateLimits(): Promise<void> {
  const db = admin.firestore();
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
  
  const batch = db.batch();
  const snapshot = await db.collection('_rateLimits')
    .where('windowStart', '<', admin.firestore.Timestamp.fromMillis(cutoff))
    .limit(500)
    .get();
  
  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

