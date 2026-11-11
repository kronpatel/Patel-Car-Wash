import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  findUserByPhone,
  findUserByReferralCode,
  createUser,
  updateUser,
  createCoinTransaction,
} from "@/lib/jsonDb";
import { generateReferralCode } from "@/lib/utils";
import { LOYALTY_RULES } from "@/lib/constants";

/**
 * POST /api/auth/signup
 * Registers a new customer with hashed credentials, referral tracking, and loyalty coins in local JSON DB.
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

    const existingByEmail = findUserByEmail(normalizedEmail);
    const existingByPhone = findUserByPhone(normalizedPhone);

    if (existingByEmail || existingByPhone) {
      return NextResponse.json(
        { success: false, error: "An account with this email or phone number already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique referral code for the new user
    let userReferralCode = generateReferralCode(name);
    let codeExists = findUserByReferralCode(userReferralCode);
    while (codeExists) {
      userReferralCode = generateReferralCode(name);
      codeExists = findUserByReferralCode(userReferralCode);
    }

    let initialCoins = 0;
    let referredByCode = null;
    let referrerUser = null;

    // Validate Referral Code if provided
    if (referralCode && typeof referralCode === "string") {
      const cleanRef = referralCode.trim().toUpperCase();
      const referrer = findUserByReferralCode(cleanRef);

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

    // 1. Create the new customer user FIRST to ensure registration succeeds before rewarding
    const newUser = createUser({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone,
      role: "customer",
      cleanCoins: initialCoins,
      referralCode: userReferralCode,
      referredBy: referredByCode,
    });

    // 2. Only after user creation succeeds, reward referrer and log transactions
    if (referrerUser) {
      const updatedReferrerCoins = (referrerUser.cleanCoins || 0) + LOYALTY_RULES.REFERRAL_BONUS_COINS;
      updateUser(referrerUser.id || referrerUser._id, {
        cleanCoins: updatedReferrerCoins,
      });

      createCoinTransaction({
        userId: referrerUser.id || referrerUser._id,
        type: "earned",
        amount: LOYALTY_RULES.REFERRAL_BONUS_COINS,
        reason: `Referral reward for inviting ${name}`,
      });
    }

    // If new user received welcome referral coins, log transaction
    if (initialCoins > 0) {
      createCoinTransaction({
        userId: newUser.id || newUser._id,
        type: "earned",
        amount: initialCoins,
        reason: `Welcome bonus for using referral code ${referredByCode}`,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully! You can now log in.",
        userId: newUser.id || newUser._id,
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
