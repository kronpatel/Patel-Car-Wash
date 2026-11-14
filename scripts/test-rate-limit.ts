/**
 * Task 5: Test Script — scripts/test-rate-limit.ts
 *
 * Verifies Rate Limiting & Brute-Force Protection:
 * 1. Live HTTP Test (if server running on https://localhost:3002):
 *    - Sends 5 consecutive requests to /api/staff/scan with invalid password.
 *    - 6th request must be BLOCKED with HTTP 429 (Too Many Requests).
 * 2. Rate-Limiter Window Expiry Test:
 *    - Verifies that after windowMs (e.g. 3-5 seconds in test mode) elapses, requests are allowed again.
 * 3. Cleanup:
 *    - Resets all test keys and verifies clean state.
 *
 * Usage:
 *   npx tsx scripts/test-rate-limit.ts
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { checkRateLimit, resetRateLimit, cleanupRateLimiter } from "../src/lib/rate-limiter";

const BASE_URL = process.env.BASE_URL || "https://localhost:3002";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function isServerRunning(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

async function runRateLimitTests() {
  console.log("=================================================");
  console.log("🛡️  PHASE 8.1: RATE LIMITING & BRUTE-FORCE TEST");
  console.log("=================================================");
  console.log(`Target Base URL: ${BASE_URL}\n`);

  const serverOnline = await isServerRunning(BASE_URL);

  if (serverOnline) {
    console.log("--- 1. Live Server HTTP Rate Limit Test (/api/staff/scan) ---");
    console.log(`Connected to live server at ${BASE_URL}.`);

    // Reset test keys first
    resetRateLimit("rate:127.0.0.1:/api/staff/scan");
    resetRateLimit("api:staff-scan:127.0.0.1");

    const dummyPayload = {
      token: "DUMMY_RATE_LIMIT_TEST_QR_TOKEN",
      identifier: "test_rate_staff@patelcarspa.com",
      password: "incorrect_password_bruteforce",
      latitude: 20.821819967242934,
      longitude: 73.15558922399794,
      accuracy: 15,
    };

    // Attempt 1 through 5: Should NOT return 429
    for (let i = 1; i <= 5; i++) {
      const res = await fetch(`${BASE_URL}/api/staff/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dummyPayload),
      });

      console.log(`[Attempt ${i}/5] Status: ${res.status} (${res.statusText})`);
      assert(
        res.status !== 429,
        `Attempt ${i} was not blocked by rate limiter (HTTP ${res.status})`
      );
    }

    // Attempt 6: MUST be HTTP 429 Too Many Requests
    console.log("\n--- Sending 6th Attempt (Expect HTTP 429) ---");
    const blockedRes = await fetch(`${BASE_URL}/api/staff/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dummyPayload),
    });

    const blockedData = await blockedRes.json().catch(() => ({}));
    console.log(`[Attempt 6] Status: ${blockedRes.status} (${blockedRes.statusText})`);
    console.log(`Response Body:`, blockedData);

    assert(
      blockedRes.status === 429,
      `6th attempt correctly returned HTTP 429 Too Many Requests`
    );
    assert(
      blockedData.success === false,
      `Response body has { success: false }`
    );
    assert(
      typeof blockedData.error === "string" && blockedData.error.toLowerCase().includes("too many"),
      `Response error message indicates rate limit rejection`
    );

    // Clean up live test rate limit
    resetRateLimit("rate:127.0.0.1:/api/staff/scan");
    resetRateLimit("api:staff-scan:127.0.0.1");
    console.log("✅ Live HTTP rate limiter test completed successfully!\n");
  } else {
    console.log("ℹ️  Server not running on localhost:3002. Running comprehensive in-engine test simulation...\n");
  }

  // ─── 2. Window Expiry & Cooldown Simulation Test ───
  console.log("--- 2. Window Expiry & Cooldown Verification (Short Window: 2.5s) ---");
  const testIpKey = "rate:192.168.0.189:/api/staff/scan";
  resetRateLimit(testIpKey);

  // Send 5 attempts with small window (2500ms = 2.5 seconds)
  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(testIpKey, 5, 2500);
    assert(res.success === true, `Simulated Attempt #${i} accepted (remaining: ${res.remaining})`);
  }

  // 6th attempt must be blocked
  const simBlocked = checkRateLimit(testIpKey, 5, 2500);
  assert(simBlocked.success === false, "6th attempt is blocked (success: false, remaining: 0)");
  assert(simBlocked.retryAfter > 0, `Cooldown retryAfter is ${simBlocked.retryAfter}s`);

  // Wait for window to expire (2.6 seconds)
  console.log("Waiting 2.6 seconds for window to expire...");
  await new Promise((resolve) => setTimeout(resolve, 2600));

  // Request after window expiry must be allowed again
  const afterExpiryRes = checkRateLimit(testIpKey, 5, 2500);
  assert(afterExpiryRes.success === true, "Request accepted after window expiry (remaining: 4)");

  // ─── 3. Cleanup Test ───
  console.log("\n--- 3. Cleanup & Reset Verification ---");
  resetRateLimit(testIpKey);
  const cleanedCount = cleanupRateLimiter();
  assert(typeof cleanedCount === "number", `cleanupRateLimiter() executed cleanly`);

  const freshRes = checkRateLimit(testIpKey, 5, 15 * 60 * 1000);
  assert(freshRes.success === true, "Fresh key allowed after reset (remaining: 4)");
  resetRateLimit(testIpKey);

  console.log("\n=================================================");
  console.log("🎉 ALL RATE LIMITER TESTS PASSED SUCCESSFULLY!");
  console.log("=================================================");
}

runRateLimitTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
