"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, X, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { QR_EXPIRY_OPTIONS } from "@/lib/constants";
import { apiPost } from "@/lib/api-client";

interface GenerateQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (qr?: any) => void;
  hasActiveQR?: boolean;
}

export default function GenerateQRModal({
  isOpen,
  onClose,
  onSuccess,
}: GenerateQRModalProps) {
  // Preselected 30 days default
  const [selectedDays, setSelectedDays] = useState<number | "custom">(30);
  const [customDays, setCustomDays] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const getEffectiveDays = (): number | null => {
    if (selectedDays === "custom") {
      const parsed = parseInt(customDays.trim(), 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 365) {
        return null;
      }
      return parsed;
    }
    return selectedDays;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveDays = getEffectiveDays();

    if (effectiveDays === null) {
      toast.error("Please enter a valid number of days between 1 and 365.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiPost<{
        success: boolean;
        data: any;
        message?: string;
      }>("/api/admin/employees/attendance/qr", {
        expiresInDays: effectiveDays,
      });

      toast.success(response.message || "New Attendance QR generated successfully!");
      onSuccess(response.data || response);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-md bg-charcoal-850 border border-white/10 rounded-2xl p-6 shadow-2xl z-10 text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-neon-blue shadow-neon-sm">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Generate Attendance QR</h3>
                <p className="text-xs text-gray-400">
                  Select validity duration for punch-in QR
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleGenerate}>
            {/* Validity Options List */}
            <div className="mt-5 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 block">
                Select Validity (Kitne din tak valid):
              </label>

              {QR_EXPIRY_OPTIONS.map((opt) => {
                const isSelected = selectedDays === opt.days;
                return (
                  <label
                    key={opt.days}
                    onClick={() => setSelectedDays(opt.days)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-neon-blue/10 border-neon-blue/60 text-white shadow-neon-sm"
                        : "bg-charcoal-900 border-white/5 text-gray-300 hover:border-white/20 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-neon-blue bg-neon-blue"
                            : "border-gray-500 bg-transparent"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-black" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </div>
                    {opt.days === 30 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-blue/15 text-neon-blue border border-neon-blue/30 font-semibold">
                        Default
                      </span>
                    )}
                  </label>
                );
              })}

              {/* Custom option */}
              <label
                onClick={() => setSelectedDays("custom")}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedDays === "custom"
                    ? "bg-neon-blue/10 border-neon-blue/60 text-white shadow-neon-sm"
                    : "bg-charcoal-900 border-white/5 text-gray-300 hover:border-white/20 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      selectedDays === "custom"
                        ? "border-neon-blue bg-neon-blue"
                        : "border-gray-500 bg-transparent"
                    }`}
                  >
                    {selectedDays === "custom" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-black" />
                    )}
                  </div>
                  <span className="text-sm font-medium">Custom Days</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    placeholder="1-365"
                    disabled={selectedDays !== "custom"}
                    value={customDays}
                    onChange={(e) => {
                      setCustomDays(e.target.value);
                      setSelectedDays("custom");
                    }}
                    className={`w-20 px-2.5 py-1 text-xs rounded-lg border text-right font-mono transition-colors ${
                      selectedDays === "custom"
                        ? "bg-charcoal-950 border-neon-blue/50 text-white focus:outline-none focus:border-neon-blue"
                        : "bg-charcoal-950/50 border-white/10 text-gray-500 cursor-not-allowed"
                    }`}
                  />
                  <span className="text-xs text-gray-400">days</span>
                </div>
              </label>
            </div>

            {/* Warning Message */}
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold">Note:</span> Generating a new QR will deactivate the current active QR immediately.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-neon-blue text-black hover:bg-neon-hover font-bold text-sm transition-all shadow-neon-sm flex items-center gap-2 disabled:opacity-50 active:scale-98"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                {loading ? "Generating QR..." : "Generate QR"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
