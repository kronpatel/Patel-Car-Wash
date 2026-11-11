import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findUserById, getBookings, getCoinTransactionsByUserId } from "@/lib/jsonDb";
import CustomerDashboardView from "@/components/dashboard/CustomerDashboardView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Dashboard & Rewards",
  description: "Track your active car wash bays, appointment schedule, Clean Coins loyalty rewards & referral balance.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  // Fetch fresh user profile from JSON DB
  const dbUser = findUserById(session.user.id);

  if (!dbUser) {
    redirect("/login");
  }

  // Fetch bookings for this customer
  const bookings = getBookings({ userId: dbUser.id || dbUser._id });

  // Fetch coin transactions for this customer
  const transactions = getCoinTransactionsByUserId(dbUser.id || dbUser._id, 30);

  const userProfile = {
    id: dbUser.id || dbUser._id,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone,
    cleanCoins: dbUser.cleanCoins || 0,
    referralCode: dbUser.referralCode || "",
  };

  return (
    <div className="py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CustomerDashboardView
          user={userProfile}
          initialBookings={bookings}
          initialTransactions={transactions}
        />
      </div>
    </div>
  );
}
