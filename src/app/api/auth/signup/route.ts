import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateReferralCode } from "@/lib/utils";
import { LOYALTY_RULES } from "@/lib/constants";

/**
 * POST /api/auth/signup
 * Registers a new customer in MySQL via Prisma with hashed credentials,
 * referral tracking, and loyalty coins.
 */
export async function POST(req: Request) {
  try {
    const { name, email, password, phone, referralCode } = await req.json();

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { success: false, error: "Please provide all required fields" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email or phone number already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique referral code for the new user
    let userReferralCode = generateReferralCode(name);
    let codeExists = await prisma.user.findUnique({
      where: { referralCode: userReferralCode },
    });
    while (codeExists) {
      userReferralCode = generateReferralCode(name);
      codeExists = await prisma.user.findUnique({
        where: { referralCode: userReferralCode },
      });
    }

    let initialCoins = 0;
    let referredByCode: string | null = null;
    let referrerUser: { id: string; cleanCoins: number } | null = null;

    // Validate Referral Code if provided
    if (referralCode && typeof referralCode === "string") {
      const cleanRef = referralCode.trim().toUpperCase();
      const referrer = await prisma.user.findUnique({
        where: { referralCode: cleanRef },
      });

      // Edge case: Block self-referral
      if (
        referrer &&
        (referrer.email.toLowerCase() === normalizedEmail || referrer.phone === normalizedPhone)
      ) {
        return NextResponse.json(
          { success: false, error: "Self-referral is not permitted." },
          { status: 400 }
        );
      }

      if (referrer) {
        referrerUser = referrer;
        referredByCode = cleanRef;
        initialCoins = LOYALTY_RULES.REFERRAL_BONUS_COINS;
      }
    }

    // Atomic creation with transactions
    const newUser = await prisma.$transaction(async (tx) => {
      // 1. Create the new customer user
      const created = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          phone: normalizedPhone,
          role: "customer",
          cleanCoins: initialCoins,
          referralCode: userReferralCode,
          referredBy: referredByCode,
        },
      });

      // 2. Reward referrer if applicable
      if (referrerUser) {
        await tx.user.update({
          where: { id: referrerUser.id },
          data: { cleanCoins: { increment: LOYALTY_RULES.REFERRAL_BONUS_COINS } },
        });

        await tx.coinTransaction.create({
          data: {
            userId: referrerUser.id,
            type: "earned",
            amount: LOYALTY_RULES.REFERRAL_BONUS_COINS,
            reason: `Referral reward for inviting ${name}`,
          },
        });
      }

      // 3. Welcome bonus for new user
      if (initialCoins > 0) {
        await tx.coinTransaction.create({
          data: {
            userId: created.id,
            type: "earned",
            amount: initialCoins,
            reason: `Welcome bonus for using referral code ${referredByCode}`,
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully! You can now log in.",
        userId: newUser.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/auth/signup error:", error);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
