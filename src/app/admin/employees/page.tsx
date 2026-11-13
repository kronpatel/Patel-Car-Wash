"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  UserMinus,
  IndianRupee,
  Plus,
  Search,
  Filter,
  X,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { STAFF_ROLES } from "@/lib/constants";
import { apiGet, apiDelete, apiPost } from "@/lib/api-client";
import type { StaffWithStats, StaffStatus } from "@/types/staff";
import StaffTable from "@/components/admin/employees/StaffTable";
import StatsCard from "@/components/admin/employees/StatsCard";
import ConfirmDialog from "@/components/admin/employees/ConfirmDialog";
import { toast } from "sonner";

export default function AdminEmployeesPage() {
  const router = useRouter();

  // State
  const [staffList, setStaffList] = useState<StaffWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modal states
  const [deactivateTarget, setDeactivateTarget] = useState<StaffWithStats | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const [resetTarget, setResetTarget] = useState<StaffWithStats | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Fetch staff list
  const fetchEmployees = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const queryParams = new URLSearchParams();
        if (selectedRole !== "all") queryParams.set("role", selectedRole);
        if (selectedStatus !== "all") queryParams.set("status", selectedStatus);
        if (search.trim()) queryParams.set("search", search.trim());

        const url = `/api/admin/employees?${queryParams.toString()}`;
        const data = await apiGet<StaffWithStats[]>(url);
        setStaffList(data || []);
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Failed to load staff:", error);
        toast.error(error.message || "Failed to load staff list");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedRole, selectedStatus, search]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 300); // 300ms debounce for search
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  // Overall Statistics calculated across all active records
  const stats = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter((s) => s.status === "ACTIVE").length;
    const onLeave = staffList.filter((s) => s.status === "ON_LEAVE").length;
    const totalMonthlySalary = staffList
      .filter((s) => s.status === "ACTIVE")
      .reduce((sum, s) => sum + (Number(s.baseSalary) || 0), 0);

    return {
      total,
      active,
      onLeave,
      totalMonthlySalary,
    };
  }, [staffList]);

  // Deactivate handler
  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivateLoading(true);

    try {
      const res = await apiDelete<{ message?: string; warning?: string }>(
        `/api/admin/employees/${deactivateTarget.id}`
      );
      if (res.warning) {
        toast.warning(`${res.message || "Staff deactivated."} (${res.warning})`);
      } else {
        toast.success("Staff deactivated successfully.");
      }
      setDeactivateTarget(null);
      fetchEmployees(true);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to deactivate staff");
    } finally {
      setDeactivateLoading(false);
    }
  };

  // Reset password handler
  const handleConfirmResetPassword = async () => {
    if (!resetTarget) return;
    setResetLoading(true);

    try {
      await apiPost(`/api/admin/employees/${resetTarget.id}/reset-password`);
      toast.success(`Password for ${resetTarget.name} reset to their mobile number.`);
      setResetTarget(null);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const hasActiveFilters = search || selectedRole !== "all" || selectedStatus !== "all";

  const clearFilters = () => {
    setSearch("");
    setSelectedRole("all");
    setSelectedStatus("all");
  };

  return (
    <div className="w-full py-8 sm:py-12">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-8">
        {/* Top Operations Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-charcoal-850/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-900 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Appointments Terminal</span>
              </Link>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-blue/15 text-neon-blue border border-neon-blue/30 text-xs font-semibold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                <span>Employee Hub</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
              Employee Management
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl">
              Control staff profiles, roles, attendance records, and monthly compensation for Patel Car&apos;spa.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => fetchEmployees(true)}
              disabled={refreshing}
              className="p-3 rounded-2xl glass-panel border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
              title="Refresh List"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-neon-blue" : ""}`} />
            </button>

            <Link
              href="/admin/employees/add"
              className="neon-glow-btn px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-neon-md w-full md:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </Link>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatsCard
            label="Total Staff"
            value={stats.total}
            icon={Users}
            accentColor="blue"
            subtext="Registered across studio"
          />
          <StatsCard
            label="Active Staff"
            value={stats.active}
            icon={UserCheck}
            accentColor="green"
            subtext="Currently operational"
          />
          <StatsCard
            label="On Leave"
            value={stats.onLeave}
            icon={UserMinus}
            accentColor="yellow"
            subtext="Temporary absences"
          />
          <StatsCard
            label="Monthly Salary Cost"
            value={`₹${stats.totalMonthlySalary.toLocaleString("en-IN")}`}
            icon={IndianRupee}
            accentColor="gold"
            subtext="Active monthly base pay"
          />
        </div>

        {/* Filter Bar */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 bg-charcoal-850/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff by name, mobile, or EMP ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-neon-blue/60 focus:ring-1 focus:ring-neon-blue/60 transition-all"
              />
            </div>

            {/* Role Filter */}
            <div className="relative shrink-0">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-neon-blue/60 focus:ring-1 focus:ring-neon-blue/60 transition-all"
              >
                <option value="all">All Roles</option>
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative shrink-0">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as StaffStatus | "all")}
                className="w-full sm:w-auto px-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-neon-blue/60 focus:ring-1 focus:ring-neon-blue/60 transition-all"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white bg-charcoal-900 border border-white/10 hover:border-white/20 transition-colors shrink-0"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Staff Table */}
        <StaffTable
          staff={staffList}
          loading={loading}
          onEdit={(member) => router.push(`/admin/employees/${member.id}`)}
          onDelete={(member) => setDeactivateTarget(member)}
          onResetPassword={(member) => setResetTarget(member)}
        />

        {/* Deactivation Confirmation Modal */}
        <ConfirmDialog
          isOpen={Boolean(deactivateTarget)}
          variant="danger"
          title={`Deactivate ${deactivateTarget?.name}?`}
          message={
            deactivateTarget?.totalPendingAdvance && deactivateTarget.totalPendingAdvance > 0
              ? `Warning: ${deactivateTarget.name} has ₹${deactivateTarget.totalPendingAdvance.toLocaleString("en-IN")} pending advance balance. Deactivating will mark them as INACTIVE while preserving attendance & salary audit logs.`
              : `Are you sure you want to deactivate ${deactivateTarget?.name}? Their login will be disabled but all past attendance and salary records will be preserved.`
          }
          confirmText="Yes, Deactivate"
          loading={deactivateLoading}
          onConfirm={handleConfirmDeactivate}
          onCancel={() => setDeactivateTarget(null)}
        />

        {/* Reset Password Confirmation Modal */}
        <ConfirmDialog
          isOpen={Boolean(resetTarget)}
          variant="warning"
          title={`Reset password for ${resetTarget?.name}?`}
          message={`This will set ${resetTarget?.name}'s password back to their registered 10-digit mobile number (+91 ${resetTarget?.mobile}).`}
          confirmText="Reset Password"
          loading={resetLoading}
          onConfirm={handleConfirmResetPassword}
          onCancel={() => setResetTarget(null)}
        />
      </div>
    </div>
  );
}
