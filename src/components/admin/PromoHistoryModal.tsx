"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  History,
  User,
  Calendar,
  Tag,
  AlertCircle,
  Loader2,
  FileText,
  Clock,
} from "lucide-react";
import { IPromoCode, IPromoCodeUsage } from "@/types";

interface PromoHistoryModalProps {
  promo: IPromoCode | null;
  onClose: () => void;
}

export default function PromoHistoryModal({
  promo,
  onClose,
}: PromoHistoryModalProps) {
  const [usages, setUsages] = useState<IPromoCodeUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!promo) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/promos/${promo.id || promo._id}/usages`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.success && Array.isArray(data.usages)) {
          setUsages(data.usages);
        } else {
          setError(data.error || "Failed to load redemption history");
        }
      })
      .catch(() => {
        if (mounted) setError("Network error loading redemption history");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [promo]);

  if (!promo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden bg-charcoal-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-heading font-bold text-white">
                  Redemption History
                </h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-neon-blue/15 text-neon-blue border border-neon-blue/30 font-bold uppercase">
                  {promo.code}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Limit: {promo.usageLimitPerUser} per user • Total uses:{" "}
                {usages.length}
                {promo.totalUsageLimit ? ` / ${promo.totalUsageLimit}` : ""}
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

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-neon-blue" />
              <span className="text-xs font-mono uppercase tracking-wider">
                Loading audit trail...
              </span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : usages.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Tag className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-sm font-medium text-gray-300">
                No redemptions recorded yet
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                When customers apply this promo code during booking, each
                redemption will be logged here with customer details and timestamp.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {usages.map((u, idx) => {
                const dateStr = new Date(u.usedAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <div
                    key={u.id || u._id || idx}
                    className="p-3.5 rounded-2xl glass-panel border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-charcoal-800 border border-white/10 flex items-center justify-center text-gray-300 shrink-0">
                        <User className="w-4 h-4 text-neon-blue" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {u.userName || "Customer"}
                        </p>
                        <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                          User ID: {u.userId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-gray-400 pl-11 sm:pl-0">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <FileText className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span className="text-gray-200">
                          {u.bookingRef || "Booking"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-charcoal-950/60 flex items-center justify-between text-xs text-gray-400">
          <span>
            Logged events are immutable for accounting and security audit.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
