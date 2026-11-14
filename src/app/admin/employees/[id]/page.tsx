"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  UserCheck,
  CalendarCheck,
  CalendarX,
  CreditCard,
  IndianRupee,
  KeyRound,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import StaffForm from "@/components/admin/employees/StaffForm";
import ConfirmDialog from "@/components/admin/employees/ConfirmDialog";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api-client";
import type { StaffWithStats, UpdateStaffInput } from "@/types/staff";
import { toast } from "sonner";

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffIdParam = params?.id as string;

  const [staff, setStaff] = useState<StaffWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchStaffDetail = useCallback(async () => {
    if (!staffIdParam) return;
    setLoading(true);

    try {
      const data = await apiGet<StaffWithStats>(`/api/admin/employees/${staffIdParam}`);
      setStaff(data);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to load staff details");
    } finally {
      setLoading(false);
    }
  }, [staffIdParam]);

  useEffect(() => {
    fetchStaffDetail();
  }, [fetchStaffDetail]);

  const handleUpdate = async (data: UpdateStaffInput) => {
    if (!staff) return;
    setSaving(true);

    try {
      await apiPut(`/api/admin/employees/${staff.id}`, data);
      toast.success("Staff details updated successfully!");
      fetchStaffDetail();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update staff record");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!staff) return;
    setResetLoading(true);

    try {
      await apiPost(`/api/admin/employees/${staff.id}/reset-password`);
      toast.success(`Password successfully reset to mobile number (+91 ${staff.mobile}).`);
      setIsResetOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!staff) return;
    setDeactivateLoading(true);

    try {
      const res = await apiDelete<{ message?: string; warning?: string }>(
        `/api/admin/employees/${staff.id}`
      );
      if (res.warning) {
        toast.warning(`${res.message || "Staff deactivated."} (${res.warning})`);
      } else {
        toast.success("Staff deactivated successfully.");
      }
      setIsDeactivateOpen(false);
      setTimeout(() => {
        router.push("/admin/employees");
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to deactivate staff");
    } finally {
      setDeactivateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
        <p className="text-sm text-gray-400">Loading staff profile...</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Staff Member Not Found</h2>
        <p className="text-sm text-gray-400">
          The requested staff record could not be found or has been deleted.
        </p>
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl neon-glow-btn text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Staff Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full py-8 sm:py-12">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Link
              href="/admin/employees"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-900 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold uppercase tracking-wider transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Staff Directory</span>
            </Link>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">
                Edit Staff — <span className="text-neon-blue font-mono">{staff.staffId}</span>
              </h1>
            </div>
            <p className="text-sm text-gray-400">
              Managing profile and attendance metrics for {staff.name} ({staff.role}).
            </p>
          </div>

          {/* Quick Actions (Reset Password, Deactivate) */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsResetOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-gold/30 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Reset Password</span>
            </button>

            {staff.status !== "INACTIVE" && (
              <button
                type="button"
                onClick={() => setIsDeactivateOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Deactivate</span>
              </button>
            )}
          </div>
        </div>

        {/* This Month Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl glass-panel border border-emerald-500/20 bg-charcoal-900/60">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase mb-1">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Present Days</span>
            </div>
            <p className="text-2xl font-bold font-heading text-white">
              {staff.presentDaysThisMonth ?? 0}
            </p>
            <p className="text-[11px] text-gray-400">This month (LATE incl.)</p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-red-500/20 bg-charcoal-900/60">
            <div className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase mb-1">
              <CalendarX className="w-3.5 h-3.5" />
              <span>Absent Days</span>
            </div>
            <p className="text-2xl font-bold font-heading text-white">
              {staff.absentDaysThisMonth ?? 0}
            </p>
            <p className="text-[11px] text-gray-400">This month</p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-amber-500/20 bg-charcoal-900/60">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase mb-1">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pending Advance</span>
            </div>
            <p className="text-2xl font-bold font-heading text-white">
              ₹{Number(staff.totalPendingAdvance || 0).toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-gray-400">To be recovered</p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-neon-blue/20 bg-charcoal-900/60">
            <div className="flex items-center gap-2 text-neon-blue text-xs font-semibold uppercase mb-1">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Calculated Salary</span>
            </div>
            <p className="text-2xl font-bold font-heading text-white">
              ₹{Number(staff.thisMonthSalary || staff.baseSalary).toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-gray-400">Estimated current cycle</p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 bg-charcoal-850/90 shadow-2xl">
          <StaffForm
            key={staff.id}
            mode="edit"
            staffId={staff.id}
            initialData={staff}
            loading={saving}
            onSubmit={handleUpdate}
            onCancel={() => router.push("/admin/employees")}
          />
        </div>

        {/* Password Reset Modal */}
        <ConfirmDialog
          isOpen={isResetOpen}
          variant="warning"
          title={`Reset password for ${staff.name}?`}
          message={`This will overwrite their password back to their 10-digit mobile number (+91 ${staff.mobile}).`}
          confirmText="Yes, Reset Password"
          loading={resetLoading}
          onConfirm={handleResetPassword}
          onCancel={() => setIsResetOpen(false)}
        />

        {/* Deactivation Modal */}
        <ConfirmDialog
          isOpen={isDeactivateOpen}
          variant="danger"
          title={`Deactivate ${staff.name}?`}
          message={
            staff.totalPendingAdvance && staff.totalPendingAdvance > 0
              ? `Warning: ${staff.name} has ₹${staff.totalPendingAdvance.toLocaleString("en-IN")} pending advance balance. Deactivating will mark their profile as INACTIVE while preserving attendance & salary records.`
              : `Are you sure you want to deactivate ${staff.name}? Their login will be disabled but all historic attendance and salary logs will remain preserved.`
          }
          confirmText="Yes, Deactivate"
          loading={deactivateLoading}
          onConfirm={handleDeactivate}
          onCancel={() => setIsDeactivateOpen(false)}
        />
      </div>
    </div>
  );
}
