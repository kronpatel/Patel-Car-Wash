"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UserCheck,
  Calendar,
  Clock,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api-client";

export interface StaffSummaryForAttendance {
  id: string;
  staffId: string;
  name: string;
  role: string;
  photo?: string | null;
}

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffSummaryForAttendance | null;
  date: string;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present (Full Day)", color: "text-emerald-400" },
  { value: "HALF_DAY", label: "Half Day", color: "text-blue-400" },
  { value: "LEAVE", label: "Leave / Approved Off", color: "text-purple-400" },
  { value: "LATE", label: "Late Mark", color: "text-amber-400" },
  { value: "ABSENT", label: "Absent", color: "text-red-400" },
] as const;

export default function ManualAttendanceModal({
  isOpen,
  onClose,
  staff,
  date,
  onSuccess,
}: ManualAttendanceModalProps) {
  const [status, setStatus] = useState<string>("PRESENT");
  const [inTime, setInTime] = useState<string>("09:00");
  const [remark, setRemark] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus("PRESENT");
      setInTime("09:00");
      setRemark("");
      setSubmitting(false);
    }
  }, [isOpen, staff]);

  if (!isOpen || !staff) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiPost("/api/admin/employees/attendance", {
        staffId: staff.id,
        date,
        status,
        inTime: status === "ABSENT" || status === "LEAVE" ? undefined : inTime,
        remark: remark.trim() || undefined,
      });

      toast.success(`Attendance marked for ${staff.name}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark attendance manually");
    } finally {
      setSubmitting(false);
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
          onClick={() => !submitting && onClose()}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl glass-panel bg-charcoal-900 border border-white/10 p-6 sm:p-7 shadow-2xl z-10 space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 text-neon-blue shadow-neon-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-white">
                  Mark Manual Attendance
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Admin override for staff who missed QR scan
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={submitting}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Staff & Date Read-only Info Card */}
            <div className="p-4 rounded-2xl bg-charcoal-850 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Employee:</span>
                <span className="text-sm font-semibold text-white">
                  {staff.name}{" "}
                  <span className="text-xs font-mono text-neon-blue">
                    ({staff.staffId})
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Role:</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/5 text-gray-200">
                  {staff.role}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  Target Date:
                </span>
                <span className="text-xs font-mono font-semibold text-gold">
                  {date}
                </span>
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 block">
                Attendance Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={submitting}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-white text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors disabled:opacity-50"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-charcoal-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* In-Time Input (Only relevant if not absent or leave) */}
            {status !== "ABSENT" && status !== "LEAVE" && (
              <div>
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neon-blue" />
                  In Time (Punch Time)
                </label>
                <input
                  type="time"
                  value={inTime}
                  onChange={(e) => setInTime(e.target.value)}
                  disabled={submitting}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-white text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors disabled:opacity-50"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Default: 09:00 AM (Official studio opening)
                </p>
              </div>
            )}

            {/* Remark (Optional) */}
            <div>
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                Admin Remark (Optional)
              </label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                disabled={submitting}
                placeholder="e.g. Phone battery died, Verified by Admin"
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors disabled:opacity-50"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="neon-glow-btn px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-neon-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Attendance</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
