"use client";

import React, { useState } from "react";
import {
  X,
  Tag,
  Percent,
  IndianRupee,
  Calendar,
  Lock,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { IPromoCode, DiscountType } from "@/types";

interface PromoFormModalProps {
  promo: IPromoCode | null; // null for Create, non-null for Edit
  isOpen: boolean;
  onClose: () => void;
  onSaved: (savedPromo: IPromoCode) => void;
}

export default function PromoFormModal({
  promo,
  isOpen,
  onClose,
  onSaved,
}: PromoFormModalProps) {
  const isEditing = Boolean(promo);

  // Form state initialized from existing promo or defaults
  const [code, setCode] = useState(promo?.code || "");
  const [discountType, setDiscountType] = useState<DiscountType>(
    promo?.discountType || "FLAT"
  );
  const [discountValue, setDiscountValue] = useState<string>(
    promo ? String(promo.discountValue) : "50"
  );
  const [minBookingAmount, setMinBookingAmount] = useState<string>(
    promo?.minBookingAmount ? String(promo.minBookingAmount) : ""
  );
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    if (promo?.expiryDate) {
      return promo.expiryDate.split("T")[0];
    }
    // Default: 1 year from today
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  // KEY FIELD: Usage Limit Per User (default: 1)
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<string>(
    promo ? String(promo.usageLimitPerUser) : "1"
  );
  const [totalUsageLimit, setTotalUsageLimit] = useState<string>(
    promo?.totalUsageLimit ? String(promo.totalUsageLimit) : ""
  );
  const [isActive, setIsActive] = useState<boolean>(promo?.isActive ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter a promo code");
      return;
    }

    const numDiscount = Number(discountValue);
    if (isNaN(numDiscount) || numDiscount <= 0) {
      setError("Discount value must be a positive number");
      return;
    }

    if (discountType === "PERCENTAGE" && numDiscount > 100) {
      setError("Percentage discount cannot exceed 100%");
      return;
    }

    const numUsageLimit = Number(usageLimitPerUser);
    if (isNaN(numUsageLimit) || numUsageLimit < 1) {
      setError("Usage limit per user must be at least 1 (e.g. 1 = single use)");
      return;
    }

    if (!expiryDate) {
      setError("Please select an expiry date");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        code: cleanCode,
        discountType,
        discountValue: numDiscount,
        minBookingAmount: minBookingAmount.trim()
          ? Number(minBookingAmount)
          : null,
        expiryDate: new Date(`${expiryDate}T23:59:59.999Z`).toISOString(),
        usageLimitPerUser: Math.floor(numUsageLimit),
        totalUsageLimit: totalUsageLimit.trim()
          ? Math.floor(Number(totalUsageLimit))
          : null,
        isActive,
      };

      const url = isEditing
        ? `/api/admin/promos/${promo?.id || promo?._id}`
        : "/api/admin/promos";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save promo code");
      } else {
        onSaved(data.promo);
        onClose();
      }
    } catch {
      setError("Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden bg-charcoal-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neon-blue/15 border border-neon-blue/30 flex items-center justify-center text-neon-blue">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-white">
                {isEditing ? `Edit Promo Code` : "Create New Promo Code"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEditing
                  ? `Updating configuration for ${promo?.code}`
                  : "All parameters are fully configurable from this terminal"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl glass-panel border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Code & Discount Type Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Promo Code Input */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Promo Code <span className="text-neon-blue">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. FIRST50"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full glass-input px-4 py-2.5 rounded-xl text-sm font-mono uppercase tracking-wider"
                />
              </div>
            </div>

            {/* Discount Type Radio / Select */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Discount Type <span className="text-neon-blue">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType("FLAT")}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    discountType === "FLAT"
                      ? "bg-neon-blue/20 border-neon-blue text-neon-blue shadow-neon-sm"
                      : "bg-charcoal-800 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Flat ₹</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiscountType("PERCENTAGE")}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    discountType === "PERCENTAGE"
                      ? "bg-neon-blue/20 border-neon-blue text-neon-blue shadow-neon-sm"
                      : "bg-charcoal-800 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Percent %</span>
                </button>
              </div>
            </div>
          </div>

          {/* Discount Value & Min Booking Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Discount Value{" "}
                <span className="text-gray-500 font-mono">
                  ({discountType === "FLAT" ? "₹ off" : "% off"})
                </span>{" "}
                <span className="text-neon-blue">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={discountType === "PERCENTAGE" ? 100 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "FLAT" ? "50" : "10"}
                className="w-full glass-input px-4 py-2.5 rounded-xl text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Min Booking Amount{" "}
                <span className="text-gray-500 font-mono">(optional)</span>
              </label>
              <input
                type="number"
                min={0}
                value={minBookingAmount}
                onChange={(e) => setMinBookingAmount(e.target.value)}
                placeholder="e.g. 300 (or leave blank)"
                className="w-full glass-input px-4 py-2.5 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neon-blue" />
              <span>Expiry Date</span>
              <span className="text-neon-blue">*</span>
            </label>
            <input
              type="date"
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
            />
          </div>

          {/* KEY SECTION: Usage Limits (The FIRST50 bug fix) */}
          <div className="p-4 rounded-2xl bg-charcoal-850/80 border border-gold/30 space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gold" />
              <span className="text-xs font-heading font-bold text-white uppercase tracking-wider">
                Usage Limits (Fixes Multiple Redemptions)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Usage Limit Per User - DEFAULT 1 */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Usage Limit Per User <span className="text-gold">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={usageLimitPerUser}
                  onChange={(e) => setUsageLimitPerUser(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 rounded-xl text-sm font-mono border-gold/40 focus:border-gold"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  <strong>1</strong> = single use per account. Set higher if
                  repeat uses are allowed.
                </p>
              </div>

              {/* Total Usage Limit (Optional) */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Total Max Uses Across All Users
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 500 (blank = unlimited)"
                  value={totalUsageLimit}
                  onChange={(e) => setTotalUsageLimit(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 rounded-xl text-sm font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Leave blank for no global cap.
                </p>
              </div>
            </div>
          </div>

          {/* Active / Inactive Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-charcoal-850 border border-white/5">
            <div>
              <p className="text-xs font-semibold text-white">Promo Status</p>
              <p className="text-[11px] text-gray-400">
                Inactive promos cannot be applied by any customer.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-charcoal-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-gray-300 hover:text-white font-medium text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="neon-glow-btn px-6 py-2.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 shadow-neon-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? "Save Changes" : "Create Code"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
