import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { VehicleType, PlanType } from "@/types";
import { PRICING_MATRIX, LOYALTY_RULES } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * CLIENT'S #1 CORE REQUIREMENT:
 * "Normal car wash price is SAME for all vehicle types. Detailing prices may vary."
 */
export function calculatePlanPrice(plan: PlanType, vehicle: VehicleType): number {
  const planConfig = PRICING_MATRIX[plan];
  if (!planConfig) return 399;

  // Basic Wash has isFixedPrice: true -> fixedPrice: 399 across all vehicles
  if (planConfig.isFixedPrice && typeof planConfig.fixedPrice === "number") {
    return planConfig.fixedPrice;
  }

  // Premium Wash or Full Detailing tiered based on vehicle type
  if (planConfig.prices && vehicle in planConfig.prices) {
    return planConfig.prices[vehicle];
  }

  return 499;
}

/**
 * Calculate Clean Coins earned on booking completion
 * Rule: ₹100 spent = 10 Clean Coins (10%)
 */
export function calculateEarnedCoins(amountPaid: number): number {
  return Math.floor(amountPaid * LOYALTY_RULES.COINS_EARNED_PER_RUPEE);
}

/**
 * Calculate rupee discount for redeemed coins
 * Rule: 100 coins = ₹50 discount (1 coin = ₹0.50)
 */
export function calculateCoinsDiscount(coins: number): number {
  return Math.floor(coins * LOYALTY_RULES.COIN_REDEMPTION_VALUE);
}

/**
 * Generate 6-character clean referral code
 */
export function generateReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase();
  const rand = Math.floor(100 + Math.random() * 900);
  return `${cleanName || "WASH"}${rand}`;
}
