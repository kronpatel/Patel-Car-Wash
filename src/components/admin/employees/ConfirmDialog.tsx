"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertCircle, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  variant?: "danger" | "default" | "warning";
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  variant = "default",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: AlertTriangle,
      iconBg: "bg-red-500/15 text-red-400 border border-red-500/30",
      btn: "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]",
    },
    warning: {
      icon: AlertCircle,
      iconBg: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      btn: "bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    },
    default: {
      icon: HelpCircle,
      iconBg: "bg-neon-blue/15 text-neon-blue border border-neon-blue/30",
      btn: "neon-glow-btn text-charcoal-950 font-bold",
    },
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !loading && onCancel()}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md rounded-3xl glass-panel bg-charcoal-900 border border-white/10 p-6 sm:p-7 shadow-2xl z-10"
        >
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-2xl shrink-0", style.iconBg)}>
              <Icon className="w-6 h-6" />
            </div>

            <div className="space-y-1.5 flex-1">
              <h3 className="text-lg font-heading font-bold text-white">
                {title}
              </h3>
              <p className="text-sm text-gray-300/90 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-7 pt-4 border-t border-white/5">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                style.btn,
                loading && "opacity-60 cursor-not-allowed"
              )}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
