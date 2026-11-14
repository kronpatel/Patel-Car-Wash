/**
 * Unit Test Script for Rate Limiter Helper (Phase 8.1)
 * Run with: npx ts-node scripts/test-rate-limiter.ts
 */

import {
  checkRateLimit,
  resetRateLimit,
  cleanupRateLimiter,
  getClientIp,
} from "../src/lib/rate-limiter";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runRateLimiterTests() {
  console.log("=================================================");
  console.log("🧪 TESTING RATE LIMITER HELPER (Phase 8.1)");
  console.log("=================================================\n");

  const testKey = "test:192.168.1.100";
  resetRateLimit(testKey);

  // Test 1: First 5 requests should succeed
  console.log("--- Test 1: 5 Allowed Requests within Limit ---");
  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(testKey, 5, 10000); // 10s window
    assert(res.success === true, `Attempt #${i} allowed (remaining: ${res.remaining})`);
    assert(res.remaining === 5 - i, `Remaining count is correctly ${5 - i}`);
  }

  // Test 2: 6th request must be blocked (HTTP 429 scenario)
  console.log("\n--- Test 2: 6th Request Exceeds Limit ---");
  const blockedRes = checkRateLimit(testKey, 5, 10000);
  assert(blockedRes.success === false, "6th attempt is successfully BLOCKED");
  assert(blockedRes.remaining === 0, "Remaining is 0 when blocked");
  assert(blockedRes.retryAfter > 0, `retryAfter is ${blockedRes.retryAfter}s`);

  // Test 3: Reset functionality
  console.log("\n--- Test 3: Reset Rate Limit Key ---");
  resetRateLimit(testKey);
  const afterReset = checkRateLimit(testKey, 5, 10000);
  assert(afterReset.success === true, "Allowed again after resetRateLimit()");
  assert(afterReset.remaining === 4, "Remaining count restarted at 4");

  // Test 4: Window expiry
  console.log("\n--- Test 4: Window Expiry Simulation ---");
  const shortKey = "test:short-window";
  resetRateLimit(shortKey);
  checkRateLimit(shortKey, 1, 50); // 50ms window
  const immediateBlock = checkRateLimit(shortKey, 1, 50);
  assert(immediateBlock.success === false, "Immediately blocked on 2nd attempt");

  await new Promise((resolve) => setTimeout(resolve, 60)); // Wait for 50ms window to expire
  const afterExpiry = checkRateLimit(shortKey, 1, 50);
  assert(afterExpiry.success === true, "Allowed again after window expired");

  // Test 5: Cleanup function
  console.log("\n--- Test 5: Cleanup of Expired Records ---");
  const cleanupCount = cleanupRateLimiter();
  assert(typeof cleanupCount === "number", `cleanupRateLimiter() executed (cleaned: ${cleanupCount})`);

  // Test 6: getClientIp helper
  console.log("\n--- Test 6: Client IP Extraction ---");
  const mockReq1 = new Request("http://localhost:3000/api/test", {
    headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
  });
  assert(getClientIp(mockReq1) === "203.0.113.195", "Extracts first IP from x-forwarded-for");

  const mockReq2 = new Request("http://localhost:3000/api/test", {
    headers: { "x-real-ip": "198.51.100.42" },
  });
  assert(getClientIp(mockReq2) === "198.51.100.42", "Extracts IP from x-real-ip");

  const mockReq3 = new Request("http://localhost:3000/api/test");
  assert(getClientIp(mockReq3) === "127.0.0.1", "Fallbacks to 127.0.0.1 when no proxy headers");

  // Test 7: Middleware Policy Simulation (rate:${ip}:${pathname})
  console.log("\n--- Test 7: Middleware Route Rate Limiting Simulation ---");
  const scanKey = `rate:192.168.0.189:/api/staff/scan`;
  resetRateLimit(scanKey);

  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(scanKey, 5, 15 * 60 * 1000);
    assert(res.success === true, `Scan attempt #${i} passed`);
  }
  const scanBlocked = checkRateLimit(scanKey, 5, 15 * 60 * 1000);
  assert(scanBlocked.success === false, "6th scan attempt is BLOCKED (429)");

  const nextAuthKey = `rate:192.168.0.189:/api/auth/callback/credentials`;
  resetRateLimit(nextAuthKey);
  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(nextAuthKey, 5, 15 * 60 * 1000);
    assert(res.success === true, `NextAuth credential attempt #${i} passed`);
  }
  const nextAuthBlocked = checkRateLimit(nextAuthKey, 5, 15 * 60 * 1000);
  assert(nextAuthBlocked.success === false, "6th NextAuth attempt is BLOCKED (429)");

  console.log("\n=================================================");
  console.log("🎉 ALL 7/7 RATE LIMITER TESTS PASSED SUCCESSFULLY!");
  console.log("=================================================");
}

runRateLimiterTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
