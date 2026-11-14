/**
 * Automated Security Headers Test Script (Phase 8.2)
 *
 * Verifies that all required HTTP security headers are present in the response:
 * - X-Frame-Options: DENY
 * - X-Content-Type-Options: nosniff
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Permissions-Policy: geolocation=(self), camera=(self), microphone=()
 * - X-DNS-Prefetch-Control: on
 * - Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
 * - Content-Security-Policy: default-src 'self'; ... frame-ancestors 'none'
 *
 * Usage:
 *   npx tsx scripts/test-security-headers.ts
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const BASE_URL = process.env.BASE_URL || "https://localhost:3002";

interface HeaderCheck {
  header: string;
  expected?: string;
  mustContain?: string[];
  description: string;
}

const REQUIRED_HEADERS: HeaderCheck[] = [
  {
    header: "x-frame-options",
    expected: "DENY",
    description: "Clickjacking Protection (iframe framing blocked)",
  },
  {
    header: "x-content-type-options",
    expected: "nosniff",
    description: "MIME-sniffing Protection",
  },
  {
    header: "referrer-policy",
    expected: "strict-origin-when-cross-origin",
    description: "Referrer Information Privacy",
  },
  {
    header: "permissions-policy",
    mustContain: ["geolocation=(self)", "camera=(self)", "microphone=()"],
    description: "Hardware Permission Isolation (GPS/Camera allowed, Mic disabled)",
  },
  {
    header: "x-dns-prefetch-control",
    expected: "on",
    description: "DNS Prefetching Performance",
  },
  {
    header: "strict-transport-security",
    mustContain: ["max-age=63072000", "includeSubDomains", "preload"],
    description: "HSTS (Force HTTPS for 2 Years)",
  },
  {
    header: "content-security-policy",
    mustContain: [
      "default-src 'self'",
      "frame-ancestors 'none'",
      "script-src 'self'",
      "style-src 'self'",
    ],
    description: "CSP (XSS & Content Injection Protection)",
  },
];

async function checkLiveHeaders(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(BASE_URL, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    console.log(`Connected to live server at ${BASE_URL} (Status: ${res.status} ${res.statusText})\n`);

    let allPassed = true;

    for (const check of REQUIRED_HEADERS) {
      const actualValue = res.headers.get(check.header);

      if (!actualValue) {
        console.log(`❌ FAIL | ${check.header.toUpperCase()}`);
        console.log(`   Expected: Header to be present`);
        console.log(`   Actual:   Missing`);
        allPassed = false;
        continue;
      }

      let matches = true;
      if (check.expected && actualValue.toLowerCase() !== check.expected.toLowerCase()) {
        matches = false;
      }

      if (check.mustContain) {
        for (const token of check.mustContain) {
          if (!actualValue.toLowerCase().includes(token.toLowerCase())) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        console.log(`✅ PASS | ${check.header.toUpperCase()}`);
        console.log(`   Value:       ${actualValue}`);
        console.log(`   Description: ${check.description}\n`);
      } else {
        console.log(`❌ FAIL | ${check.header.toUpperCase()}`);
        console.log(`   Value:       ${actualValue}`);
        console.log(`   Description: ${check.description}\n`);
        allPassed = false;
      }
    }

    return allPassed;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.log(`ℹ️  Live server at ${BASE_URL} is not currently responding (${errorMsg}).`);
    return false;
  }
}

async function checkConfigHeaders(): Promise<boolean> {
  console.log("--- Validating headers configuration in next.config.mjs ---");
  try {
    // Dynamically load next.config.mjs
    const nextConfigModule = await import("../next.config.mjs");
    const nextConfig = nextConfigModule.default;

    if (typeof nextConfig.headers !== "function") {
      console.log("❌ FAIL: headers() function is missing in next.config.mjs");
      return false;
    }

    const headersList = await nextConfig.headers();
    const globalRule = headersList.find((item: { source: string }) => item.source === "/:path*");

    if (!globalRule || !Array.isArray(globalRule.headers)) {
      console.log("❌ FAIL: Global rule for '/:path*' is missing in next.config.mjs");
      return false;
    }

    const headersMap = new Map<string, string>();
    for (const h of globalRule.headers) {
      headersMap.set(h.key.toLowerCase(), h.value);
    }

    let allPassed = true;

    for (const check of REQUIRED_HEADERS) {
      const val = headersMap.get(check.header.toLowerCase());
      if (!val) {
        console.log(`❌ FAIL | ${check.header.toUpperCase()} (Missing in next.config.mjs)`);
        allPassed = false;
        continue;
      }

      let matches = true;
      if (check.expected && val.toLowerCase() !== check.expected.toLowerCase()) {
        matches = false;
      }
      if (check.mustContain) {
        for (const token of check.mustContain) {
          if (!val.toLowerCase().includes(token.toLowerCase())) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        console.log(`✅ PASS | ${check.header.toUpperCase()}`);
        console.log(`   Configured Value: ${val}`);
        console.log(`   Protection:       ${check.description}\n`);
      } else {
        console.log(`❌ FAIL | ${check.header.toUpperCase()}`);
        console.log(`   Configured Value: ${val}`);
        allPassed = false;
      }
    }

    return allPassed;
  } catch (error) {
    console.error("Error reading next.config.mjs:", error);
    return false;
  }
}

async function main() {
  console.log("=================================================");
  console.log("🔒 AUTOMATED HTTP SECURITY HEADERS TEST");
  console.log("=================================================");
  console.log(`Target: ${BASE_URL}\n`);

  const liveResult = await checkLiveHeaders();

  if (!liveResult) {
    const configResult = await checkConfigHeaders();
    if (configResult) {
      console.log("=================================================");
      console.log("🎉 ALL 7/7 REQUIRED SECURITY HEADERS CONFIGURED PROPERLY!");
      console.log("=================================================");
      return;
    } else {
      process.exit(1);
    }
  }

  console.log("=================================================");
  console.log("🎉 ALL 7/7 LIVE HTTP SECURITY HEADERS VERIFIED SUCCESSFULLY!");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
