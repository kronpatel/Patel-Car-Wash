import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PromosManager from "@/components/admin/PromosManager";
import {
  Tag,
  Sparkles,
  Lock,
  Layers,
  ArrowLeft,
  Ticket,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promo Code Management | Admin Terminal",
  description:
    "Patel Car'spa & Detailing Studio promo code control station. Configure discounts, expiration dates, and per-user redemption limits.",
};

function getPromoCodeStatus(promo: { isActive: boolean; expiryDate: Date }): "active" | "expired" | "inactive" {
  if (!promo.isActive) return "inactive";
  if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) return "expired";
  return "active";
}

export default async function AdminPromosPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/promos");
  }

  // Strict Admin Role Guard
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch all promo codes from MySQL with usage counts
  const rawPromos = await prisma.promoCode.findMany({
    include: {
      _count: {
        select: { usages: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const initialPromos = rawPromos.map((p) => ({
    ...p,
    expiryDate: p.expiryDate.toISOString(),
    usedCount: p._count.usages,
    computedStatus: getPromoCodeStatus(p),
  }));

  const totalCodes = initialPromos.length;
  const activeCodes = initialPromos.filter(
    (p) => p.computedStatus === "active"
  ).length;
  const totalRedemptions = initialPromos.reduce(
    (acc, p) => acc + (p.usedCount || 0),
    0
  );
  const singleUseCodes = initialPromos.filter(
    (p) => p.usageLimitPerUser === 1
  ).length;

  return (
    <div className="w-full py-10 sm:py-16">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-10">
        {/* Operations Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-gold/30 bg-charcoal-850/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-900 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Appointments Terminal</span>
              </Link>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 text-xs font-semibold uppercase tracking-wider">
                <Ticket className="w-3.5 h-3.5" />
                <span>Promo Control Station</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-white">
              Promo Code Management
            </h1>
            <p className="text-sm text-gray-400">
              Configure promo rules, discounts, and strict per-user usage limits in MySQL.
              Logged in as Master Administrator ({session.user.name})
            </p>
          </div>

          {/* Quick Sub-navigation */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-white/10 text-xs text-gray-300 hover:text-white transition-colors"
            >
              Bay Appointments
            </Link>
            <span className="px-4 py-2 rounded-xl bg-neon-blue/20 border border-neon-blue text-xs text-neon-blue font-bold">
              Promo Codes
            </span>
          </div>
        </div>

        {/* Telemetry Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                Total Promo Codes
              </span>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-neon-blue/30 bg-neon-blue/10 text-neon-blue">
                <Tag className="w-5 h-5" />
              </div>
            </div>
            <div className="mb-2">
              <span className="text-3xl font-heading font-black text-white tracking-tight">
                {totalCodes}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Registered in MySQL database
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                Active & Redeemable
              </span>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="mb-2">
              <span className="text-3xl font-heading font-black text-white tracking-tight">
                {activeCodes}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Ready for customer application
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                Total Redemptions
              </span>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-gold/30 bg-gold/10 text-gold">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mb-2">
              <span className="text-3xl font-heading font-black text-white tracking-tight">
                {totalRedemptions}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Logged in audit trail
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                Single-Use Codes (1x limit)
              </span>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
            </div>
            <div className="mb-2">
              <span className="text-3xl font-heading font-black text-white tracking-tight">
                {singleUseCodes}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Includes FIRST50 one-time protection
            </p>
          </div>
        </div>

        {/* Promo Manager (Table, Filters, Modals) */}
        <PromosManager initialPromos={initialPromos} />
      </div>
    </div>
  );
}
