/**
 * In-memory API Rate Limiter
 * Provides brute-force and abuse protection without external dependencies (Redis-free).
 * Compatible with Edge Runtime and Node.js Serverless Runtime.
 */

export interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfter: number; // in seconds
  resetTime: number; // timestamp in ms
}

// In-memory store (Map)
const store = new Map<string, RateLimitRecord>();

const DEFAULT_WINDOW_MS =
  typeof process !== "undefined" && process.env?.RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000
    : 15 * 60 * 1000;

/**
 * Check and record a rate limit attempt for a unique key (e.g. IP + endpoint)
 * @param key Unique identifier (e.g., "scan:192.168.1.1")
 * @param limit Maximum allowed attempts within window (default: 5)
 * @param windowMs Time window in milliseconds (default: 15 minutes = 900,000ms or RATE_LIMIT_WINDOW_MS)
 * @returns { success: boolean, limit: number, remaining: number, retryAfter: number, resetTime: number }
 */
export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = DEFAULT_WINDOW_MS
): RateLimitResult {
  const now = Date.now();

  // Lazy cleanup if map grows too large to prevent memory leak
  if (store.size > 2000) {
    cleanupRateLimiter();
  }

  const record = store.get(key);

  // If no record exists or previous window has expired, start a fresh window
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    store.set(key, { count: 1, resetTime });
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfter: 0,
      resetTime,
    };
  }

  // If window is active and attempt limit has been reached
  if (record.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      retryAfter,
      resetTime: record.resetTime,
    };
  }

  // Increment counter for current active window
  record.count += 1;
  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - record.count),
    retryAfter: 0,
    resetTime: record.resetTime,
  };
}

/**
 * Reset rate limit counter for a specific key (e.g. upon successful authentication)
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Clean up expired entries to reclaim memory
 */
export function cleanupRateLimiter(): number {
  const now = Date.now();
  let cleanedCount = 0;
  store.forEach((record, key) => {
    if (now > record.resetTime) {
      store.delete(key);
      cleanedCount++;
    }
  });
  return cleanedCount;
}

/**
 * Helper to safely extract client IP from incoming Next.js Request or NextRequest headers
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // 'x-forwarded-for' can contain multiple comma-separated IPs. First one is the real client.
    const clientIp = forwardedFor.split(",")[0].trim();
    if (clientIp) return clientIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  return "127.0.0.1";
}
