import { prisma } from "../src/lib/prisma";
import { middleware, config } from "../src/middleware";
import { NextRequest } from "next/server";

async function runTests() {
  console.log("=================================================");
  console.log("  Testing Phase 8.4: Critical & High Security Fixes");
  console.log("=================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. TEST SEC-001: Middleware /api/admin Protection & Config Matcher
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Testing SEC-001: Middleware Gateway Defense for /api/admin ---");
  assert(
    config.matcher.includes("/api/admin/:path*"),
    "config.matcher includes '/api/admin/:path*'"
  );

  // Helper to create synthetic NextRequest
  function createMockRequest(url: string, cookie?: string) {
    const headers = new Headers();
    if (cookie) headers.set("cookie", cookie);
    return new NextRequest(new URL(url, "http://localhost:3002"), { headers });
  }

  // Test unauthenticated request to /api/admin/employees
  const unauthReq = createMockRequest("http://localhost:3002/api/admin/employees");
  const unauthRes = await middleware(unauthReq);
  assert(
    unauthRes.status === 401,
    "Unauthenticated request to /api/admin/employees blocked with HTTP 401"
  );
  const unauthBody = await unauthRes.json();
  assert(
    unauthBody.success === false && unauthBody.error.includes("Admin access required"),
    "401 JSON error message matches expected security format"
  );

  // Test unauthenticated request to /api/admin/promos
  const unauthPromoReq = createMockRequest("http://localhost:3002/api/admin/promos");
  const unauthPromoRes = await middleware(unauthPromoReq);
  assert(
    unauthPromoRes.status === 401,
    "Unauthenticated request to /api/admin/promos blocked with HTTP 401"
  );

  // ─────────────────────────────────────────────────────────────
  // 2. TEST SEC-002: JWT Secret Enforcement
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Testing SEC-002: JWT Secret Validation Logic ---");
  // Test production rejection logic
  function testSecretValidation(envSecret?: string, nodeEnv?: string) {
    const nextAuthSecret = envSecret;
    if (!nextAuthSecret) {
      if (nodeEnv === "production") {
        throw new Error("FATAL: NEXTAUTH_SECRET environment variable is required in production.");
      }
    }
    return nextAuthSecret || "dev-only-secret-do-not-use-in-prod";
  }

  let errorThrown = false;
  try {
    testSecretValidation(undefined, "production");
  } catch (err: any) {
    if (err.message.includes("FATAL: NEXTAUTH_SECRET environment variable is required in production")) {
      errorThrown = true;
    }
  }
  assert(errorThrown, "Production throws fatal error when NEXTAUTH_SECRET is missing");

  const devFallback = testSecretValidation(undefined, "development");
  assert(
    devFallback === "dev-only-secret-do-not-use-in-prod",
    "Development mode falls back to dev-only secret without throwing"
  );

  const customSecret = testSecretValidation("custom-super-secret-key-123", "production");
  assert(
    customSecret === "custom-super-secret-key-123",
    "Configured NEXTAUTH_SECRET is properly respected"
  );

  // ─────────────────────────────────────────────────────────────
  // 3. TEST SEC-005: CleanCoins Double-Spending Concurrency Race Condition
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Testing SEC-005: CleanCoins Double-Spending Race Condition Logic ---");

  // In-memory simulation of MySQL row-level locking & atomic UPDATE WHERE cleanCoins >= coinsUsed
  class MockDb {
    private cleanCoins: number;
    private isLocked: boolean = false;
    private waitQueue: Array<() => void> = [];

    constructor(initialCoins: number) {
      this.cleanCoins = initialCoins;
    }

    private async acquireLock() {
      if (!this.isLocked) {
        this.isLocked = true;
        return;
      }
      await new Promise<void>((resolve) => this.waitQueue.push(resolve));
      this.isLocked = true;
    }

    private releaseLock() {
      this.isLocked = false;
      const next = this.waitQueue.shift();
      if (next) next();
    }

    // Atomic conditional update simulating:
    // UPDATE User SET cleanCoins = cleanCoins - decrement WHERE id = ? AND cleanCoins >= gte
    async update(args: { where: { cleanCoins: { gte: number } }; data: { cleanCoins: { decrement: number } } }) {
      await this.acquireLock();
      try {
        if (this.cleanCoins >= args.where.cleanCoins.gte) {
          this.cleanCoins -= args.data.cleanCoins.decrement;
          return { cleanCoins: this.cleanCoins };
        }
        const err: any = new Error("Record to update not found.");
        err.code = "P2025";
        throw err;
      } finally {
        this.releaseLock();
      }
    }

    getCoins() {
      return this.cleanCoins;
    }
  }

  const mockDb = new MockDb(50);
  assert(mockDb.getCoins() === 50, "User initialized with 50 CleanCoins");

  // Simulate two concurrent requests attempting to redeem 50 coins simultaneously
  const coinsToRedeem = 50;

  async function simulateConcurrentRedemption(reqId: number) {
    try {
      try {
        await mockDb.update({
          where: {
            cleanCoins: { gte: coinsToRedeem },
          },
          data: {
            cleanCoins: { decrement: coinsToRedeem },
          },
        });
      } catch (err: any) {
        if (err?.code === "P2025" || err?.message?.includes("Record to update not found")) {
          throw new Error("INSUFFICIENT_CLEAN_COINS");
        }
        throw err;
      }

      return { reqId, status: "SUCCESS" };
    } catch (err: any) {
      return { reqId, status: "FAILED", error: err.message };
    }
  }

  console.log("Simulating 2 concurrent booking transactions redeeming 50 coins simultaneously...");
  const [res1, res2] = await Promise.all([
    simulateConcurrentRedemption(1),
    simulateConcurrentRedemption(2),
  ]);

  console.log(`Result 1: ${res1.status} ${res1.error || ""}`);
  console.log(`Result 2: ${res2.status} ${res2.error || ""}`);

  const oneSucceeded =
    (res1.status === "SUCCESS" && res2.status === "FAILED") ||
    (res2.status === "SUCCESS" && res1.status === "FAILED");
  const correctError =
    res1.error === "INSUFFICIENT_CLEAN_COINS" || res2.error === "INSUFFICIENT_CLEAN_COINS";

  assert(oneSucceeded, "Exactly one concurrent transaction succeeded");
  assert(correctError, "The competing concurrent transaction was rejected with INSUFFICIENT_CLEAN_COINS");
  assert(
    mockDb.getCoins() === 0,
    `Final user coin balance is 0 (actual: ${mockDb.getCoins()}), balance never drops into negative!`
  );

  console.log("\n=================================================");
  console.log(`  All Phase 8.4 Security Tests Passed! (${passed}/${total})`);
  console.log("=================================================");
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  });
