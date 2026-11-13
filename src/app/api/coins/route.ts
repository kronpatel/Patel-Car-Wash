import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LOYALTY_RULES } from "@/lib/constants";
import { calculateCoinsDiscount } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/coins
 * Fetches user's loyalty balance, rupee worth, referral code, and transaction log from MySQL.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const transactions = await prisma.coinTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const rupeeWorth = calculateCoinsDiscount(user.cleanCoins);

    return NextResponse.json({
      success: true,
      balance: user.cleanCoins,
      rupeeWorth,
      referralCode: user.referralCode,
      rules: {
        earningRate: "₹100 spent = 10 Clean Coins",
        redemptionRate: "100 coins = ₹50 off next wash",
        minRedeem: LOYALTY_RULES.MIN_COINS_TO_REDEEM,
        referralReward: LOYALTY_RULES.REFERRAL_BONUS_COINS,
      },
      transactions,
    });
  } catch (error) {
    console.error("GET /api/coins error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve coin balance" },
      { status: 500 }
    );
  }
}
