"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Calendar,
  Clock,
  Sparkles,
  Coins,
  Tag,
  Check,
  AlertCircle,
  Loader2,
  MapPin,
  FileText,
} from "lucide-react";
import { VehicleType, PlanType, IBooking } from "@/types";
import {
  SERVICES,
  TIME_SLOTS,
  VEHICLE_TYPES,
  PAYMENT_CONFIG,
  LOYALTY_RULES,
} from "@/lib/constants";
import {
  calculatePlanPrice,
  calculateCoinsDiscount,
  formatINR,
} from "@/lib/utils";
import BookingSuccessModal from "./BookingSuccessModal";

interface BookingFormProps {
  initialService?: string;
  initialPlan?: PlanType;
  initialVehicle?: VehicleType;
  initialMembership?: string;
  userCoins: number;
}

export default function BookingForm({
  initialService,
  initialPlan = "Basic Wash",
  initialVehicle = "Small Sedan",
  initialMembership,
  userCoins = 0,
}: BookingFormProps) {
  const router = useRouter();

  // Form State
  const [service, setService] = useState<string>(
    initialService || SERVICES[0].title
  );
  const [plan, setPlan] = useState<PlanType>(initialPlan);
  const [vehicleType, setVehicleType] = useState<VehicleType>(initialVehicle);
  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [date, setDate] = useState<string>(() => {
    return new Date().toLocaleDateString("en-CA");
  });
  const [timeSlot, setTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [address, setAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>(
    initialMembership ? `Applying membership pass: ${initialMembership}` : ""
  );
  const [useCleanCoins, setUseCleanCoins] = useState<boolean>(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [couponError, setCouponError] = useState<string>("");

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [confirmedBooking, setConfirmedBooking] = useState<IBooking | null>(
    null
  );

  // Pricing Calculation (Honoring client's #1 rule: Basic Wash is same price for all vehicle types!)
  const basePrice = calculatePlanPrice(plan, vehicleType);

  // Coins Discount (Capped at 50% max of basePrice; minimum 50 coins required)
  const maxCoinsDiscount = Math.floor(basePrice * 0.5);
  const rawCoinsDiscount =
    useCleanCoins && userCoins >= LOYALTY_RULES.MIN_COINS_TO_REDEEM
      ? calculateCoinsDiscount(userCoins)
      : 0;
  const coinsDiscount = Math.min(rawCoinsDiscount, maxCoinsDiscount);
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const totalDiscount = coinsDiscount + couponDiscount;
  const finalPrice = Math.max(basePrice - totalDiscount, 99);

  // Minimum date = today in local IST time (no past dates)
  const minDate = new Date().toLocaleDateString("en-CA");

  // Handle Coupon Validation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderAmount: basePrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "Invalid coupon code");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: data.code, discount: data.discount });
        setCouponError("");
      }
    } catch {
      setCouponError("Network error validating coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!vehicleNumber.trim()) {
      setSubmitError("Please enter your vehicle registration number");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          plan,
          vehicleType,
          vehicleNumber: vehicleNumber.toUpperCase().trim(),
          date,
          timeSlot,
          address: address.trim(),
          notes: notes.trim(),
          useCleanCoins,
          couponCode: appliedCoupon?.code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?callbackUrl=/book`);
          return;
        }
        setSubmitError(data.error || "Failed to confirm booking");
      } else {
        setConfirmedBooking(data.booking);
      }
    } catch {
      setSubmitError("Network connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {confirmedBooking && (
        <BookingSuccessModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-8"
      >
        {initialMembership && (
          <div className="p-4 rounded-2xl bg-gold/15 border border-gold/40 text-gold-light text-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-gold shrink-0" />
              <span>
                Selected Pass: <strong>{initialMembership}</strong>
              </span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-gold/20 text-gold border border-gold/30 uppercase font-semibold">
              VIP Member
            </span>
          </div>
        )}

        {submitError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Section 1: Service & Package Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neon-blue" />
            <span>1. Service & Wash Package</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Service Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Desired Service
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full glass-input px-4 py-3 rounded-xl text-sm"
              >
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.title} className="bg-charcoal-900">
                    {s.title} ({s.duration})
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Tier */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Package Tier
              </label>
              <select
                value={plan}
                onChange={(e) => {
                  setPlan(e.target.value as PlanType);
                  setAppliedCoupon(null);
                  setCouponError("");
                }}
                className="w-full glass-input px-4 py-3 rounded-xl text-sm"
              >
                <option value="Basic Wash" className="bg-charcoal-900">
                  Basic Wash (Flat ₹399 all vehicles)
                </option>
                <option value="Premium Wash" className="bg-charcoal-900">
                  Premium Wash (Deep vacuum + gloss)
                </option>
                <option value="Full Detailing" className="bg-charcoal-900">
                  Full Detailing (Machine polish & ceramic)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Vehicle Details */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-lg font-heading font-semibold text-white flex items-center gap-2">
            <Car className="w-4 h-4 text-neon-blue" />
            <span>2. Vehicle Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Vehicle Type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => {
                  setVehicleType(e.target.value as VehicleType);
                  setAppliedCoupon(null);
                  setCouponError("");
                }}
                className="w-full glass-input px-4 py-3 rounded-xl text-sm"
              >
                {VEHICLE_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-charcoal-900">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Registration Number */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Vehicle Number Plate
              </label>
              <input
                type="text"
                required
                placeholder="e.g. HR26 DK 1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                className="w-full glass-input px-4 py-3 rounded-xl text-sm font-mono uppercase tracking-wider"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Appointment Date & Time */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-lg font-heading font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neon-blue" />
            <span>3. Preferred Schedule</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Date (No past dates)
              </label>
              <input
                type="date"
                required
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full glass-input px-4 py-3 rounded-xl text-sm"
              />
            </div>

            {/* Time Slot Picker */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full glass-input px-4 py-3 rounded-xl text-sm"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot} className="bg-charcoal-900">
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Pickup Location */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span>Doorstep Pickup Address (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Leave blank if you will drive to our workshop"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>Special Instructions / Focus Areas (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Focus on pet hair removal in back seats"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Section 4: Clean Coins & Coupons */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-lg font-heading font-semibold text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-gold" />
            <span>4. Loyalty Coins & Discounts</span>
          </h3>

          {/* Clean Coins Toggle - Only show if user meets minimum redemption threshold */}
          {userCoins >= LOYALTY_RULES.MIN_COINS_TO_REDEEM ? (
            <div className="p-4 rounded-2xl bg-charcoal-850/80 border border-gold/20 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    Redeem Clean Coins
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                    {userCoins} Available
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Worth ₹{Math.min(calculateCoinsDiscount(userCoins), maxCoinsDiscount)} discount on this wash (Max 50% off)
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCleanCoins}
                  onChange={(e) => setUseCleanCoins(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-charcoal-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
              </label>
            </div>
          ) : userCoins > 0 ? (
            <div className="p-4 rounded-2xl bg-charcoal-850/50 border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Coins className="w-3.5 h-3.5 text-gold" />
                <span>
                  You have <strong className="text-gold">{userCoins} Clean Coins</strong>
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Minimum {LOYALTY_RULES.MIN_COINS_TO_REDEEM} coins required to redeem discount. Complete this wash to earn {Math.floor(finalPrice * 0.1)} more coins!
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">
              You will earn {Math.floor(finalPrice * 0.1)} Clean Coins upon completion of this wash!
            </p>
          )}

          {/* Coupon Code Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Enter Promo Code (e.g. FIRST50)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm font-mono uppercase"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="px-5 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-white font-medium text-xs border border-white/10 transition-colors disabled:opacity-50"
            >
              {couponLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </button>
          </div>

          {appliedCoupon && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>
                Code {appliedCoupon.code} applied! Saved ₹{appliedCoupon.discount}
              </span>
            </p>
          )}

          {couponError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{couponError}</span>
            </p>
          )}
        </div>

        {/* Section 5: Order Summary & Pay at Counter */}
        <div className="p-5 rounded-2xl bg-charcoal-850 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span>Base Package Rate ({plan})</span>
            <span className="font-semibold text-white">
              {formatINR(basePrice)}
            </span>
          </div>

          {coinsDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-gold">
              <span>Clean Coins Discount</span>
              <span>- {formatINR(coinsDiscount)}</span>
            </div>
          )}

          {couponDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-emerald-400">
              <span>Coupon Promo Discount</span>
              <span>- {formatINR(couponDiscount)}</span>
            </div>
          )}

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                Total Payable at Workshop
              </p>
              <p className="text-xs text-gray-400">
                💵 {PAYMENT_CONFIG.note}
              </p>
            </div>
            <span className="text-3xl font-heading font-black text-neon-blue">
              {formatINR(finalPrice)}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full neon-glow-btn py-4 rounded-2xl font-heading font-bold text-base flex items-center justify-center gap-2 shadow-neon-md disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Securing Your Bay...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>Confirm & Lock In Slot</span>
            </>
          )}
        </button>
      </form>
    </>
  );
}
