import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findUserById } from "@/lib/jsonDb";
import { PlanType, VehicleType } from "@/types";
import BookingForm from "@/components/booking/BookingForm";
import { Sparkles, ShieldCheck, Clock, Coffee, Wifi, Video } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a Wash Bay",
  description:
    "Reserve your car wash or detailing appointment at Patel Car'spa & Detailing Studio Gujarat. Fast, scratch-free service with zero upfront payment.",
};

interface BookPageProps {
  searchParams: {
    service?: string;
    plan?: string;
    vehicle?: string;
    membership?: string;
  };
}

export default async function BookPage({ searchParams }: BookPageProps) {
  // 1. Verify User Authentication Session
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    const callbackParams = new URLSearchParams();
    if (searchParams.service) callbackParams.set("service", searchParams.service);
    if (searchParams.plan) callbackParams.set("plan", searchParams.plan);
    if (searchParams.vehicle) callbackParams.set("vehicle", searchParams.vehicle);
    if (searchParams.membership) callbackParams.set("membership", searchParams.membership);
    const queryString = callbackParams.toString();
    const callbackUrl = queryString ? `/book?${queryString}` : "/book";
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // 2. Query fresh coin balance from database
  const dbUser = findUserById(session.user.id);
  const userCoins = dbUser?.cleanCoins ?? session.user.cleanCoins ?? 0;

  // Extract any pre-filled query parameters
  const initialService = searchParams.service || undefined;
  const initialPlan = (searchParams.plan as PlanType) || "Basic Wash";
  const initialVehicle = (searchParams.vehicle as VehicleType) || "Small Sedan";
  const initialMembership = searchParams.membership || undefined;

  return (
    <div className="w-full py-10 sm:py-16">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-xs font-semibold text-neon-blue mb-4">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Guaranteed Bay Reservation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-white tracking-tight mb-3">
            Book Your <span className="text-neon-blue glow-text-neon">Detailing Bay</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto">
            Reserve your bay and time slot in under 60 seconds. Pay at the
            workshop after service completion.
          </p>
        </div>

        {/* Customer Lounge Perks Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="glass-panel p-3 rounded-2xl border border-white/5 flex items-center gap-2.5 text-xs text-gray-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Pay After Wash</span>
          </div>
          <div className="glass-panel p-3 rounded-2xl border border-white/5 flex items-center gap-2.5 text-xs text-gray-300">
            <Clock className="w-4 h-4 text-neon-blue shrink-0" />
            <span>25-Min Express Bays</span>
          </div>
          <div className="glass-panel p-3 rounded-2xl border border-white/5 flex items-center gap-2.5 text-xs text-gray-300">
            <Coffee className="w-4 h-4 text-gold shrink-0" />
            <span>AC Lounge &amp; Coffee</span>
          </div>
          <div className="glass-panel p-3 rounded-2xl border border-white/5 flex items-center gap-2.5 text-xs text-gray-300">
            <Video className="w-4 h-4 text-neon-blue shrink-0" />
            <span>Live Bay Camera Feed</span>
          </div>
        </div>

        {/* Interactive Booking Form */}
        <BookingForm
          initialService={initialService}
          initialPlan={initialPlan}
          initialVehicle={initialVehicle}
          initialMembership={initialMembership}
          userCoins={userCoins}
        />
      </div>
    </div>
  );
}
