import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CustomerDashboardView from "@/components/dashboard/CustomerDashboardView";
import { IBooking, ICoinTransaction } from "@/types";

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

  // Fetch fresh user profile from MySQL via Prisma
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser) {
    redirect("/login");
  }

  // Fetch bookings and coin transactions for this customer concurrently
  const [rawBookings, rawTransactions] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.coinTransaction.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const bookings = rawBookings as unknown as IBooking[];
  const transactions = rawTransactions as unknown as ICoinTransaction[];

  const userProfile = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone,
    cleanCoins: dbUser.cleanCoins,
    referralCode: dbUser.referralCode,
  };

  return (
    <div className="w-full py-10 sm:py-16">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <CustomerDashboardView
          user={userProfile}
          initialBookings={bookings}
          initialTransactions={transactions}
        />
      </div>
    </div>
  );
}
