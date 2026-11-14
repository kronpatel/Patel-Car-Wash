import { isSuspiciousLocation, isWithinShopRadius } from "../src/lib/location";

console.log("\n=======================================================");
console.log(" 🧪 PHASE 8.3: MOCK GPS / ACCURACY VERIFICATION SUITE ");
console.log("=======================================================\n");

let passed = 0;
let total = 0;

function assert(description: string, condition: boolean) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
  }
}

// 1. Accuracy = 0 (Fake GPS app spoofing)
const test0 = isSuspiciousLocation(0);
assert("accuracy === 0 flagged as suspicious (Mock GPS app)", test0.isSuspicious === true);
assert(
  "accuracy === 0 reason mentions Fake GPS",
  Boolean(test0.reason && test0.reason.includes("Fake GPS detected"))
);

// 2. Accuracy > 100 (Degraded GPS / Tower triangulation)
const test150 = isSuspiciousLocation(150);
assert("accuracy === 150 flagged as suspicious (too low)", test150.isSuspicious === true);
assert(
  "accuracy === 150 reason mentions low accuracy",
  Boolean(test150.reason && test150.reason.includes("GPS accuracy is too low"))
);

// 3. Boundary check: accuracy = 100 (Valid boundary)
const test100 = isSuspiciousLocation(100);
assert("accuracy === 100 is NOT suspicious (threshold boundary)", test100.isSuspicious === false);

// 4. Boundary check: accuracy = 101 (Exceeds boundary)
const test101 = isSuspiciousLocation(101);
assert("accuracy === 101 flagged as suspicious", test101.isSuspicious === true);

// 5. Realistic GPS: accuracy = 5m to 25m
const test12 = isSuspiciousLocation(12.4);
assert("accuracy === 12.4m (typical phone GPS) is accepted", test12.isSuspicious === false);

const test5 = isSuspiciousLocation(5);
assert("accuracy === 5m (high precision GPS) is accepted", test5.isSuspicious === false);

console.log("\n-------------------------------------------------------");
console.log(` Result: ${passed}/${total} checks passed`);
console.log("-------------------------------------------------------\n");

if (passed !== total) {
  process.exit(1);
} else {
  console.log("✨ All Mock GPS tests passed successfully!\n");
}
