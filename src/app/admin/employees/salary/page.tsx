"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  Filter,
  CreditCard,
  AlertCircle,
  FileText,
  X,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { SHOP_CONFIG } from "@/lib/constants";
import ConfirmDialog from "@/components/admin/employees/ConfirmDialog";

interface StaffItem {
  id: string;
  staffId: string;
  name: string;
  role: string;
  photo: string | null;
  baseSalary: number;
}

interface SalaryRecord {
  id: string;
  staffId: string;
  month: number;
  year: number;
  baseSalary: number;
  presentDays: number;
  absentDays: number;
  advanceCut: number;
  deduction: number;
  bonus: number;
  finalSalary: number;
  paymentDate: string | null;
  paymentMode: "CASH" | "UPI" | "BANK" | null;
  isPaid: boolean;
  isManual: boolean;
  remark: string | null;
  createdAt: string;
  staff: {
    id: string;
    staffId: string;
    name: string;
    role: string;
    photo: string | null;
    mobile: string;
    baseSalary: number;
  };
}

interface AutoCalculationPreview {
  staffId: string;
  staffName: string;
  staffCode: string;
  role: string;
  month: number;
  year: number;
  baseSalary: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  totalAttendedDays: number;
  dailyWage: number;
  deduction: number;
  pendingAdvance: number;
  netEstimatedSalary: number;
  isAlreadyGenerated: boolean;
  existingRecord?: SalaryRecord | null;
}

interface SalarySummary {
  count: number;
  totalPayout: number;
  totalPaid: number;
  totalUnpaid: number;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function SalaryManagementPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [activeTab, setActiveTab] = useState<"records" | "generate">("records");

  // Data states
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [summary, setSummary] = useState({ count: 0, totalPayout: 0, totalPaid: 0, totalUnpaid: 0 });
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Generate Modal state
  const [generateStaff, setGenerateStaff] = useState<StaffItem | null>(null);
  const [calcPreview, setCalcPreview] = useState<AutoCalculationPreview | null>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);
  const [advanceCutInput, setAdvanceCutInput] = useState<string>("0");
  const [bonusInput, setBonusInput] = useState<string>("0");
  const [deductionInput, setDeductionInput] = useState<string>("0");
  const [remarkInput, setRemarkInput] = useState<string>("");
  const [markPaidInput, setMarkPaidInput] = useState<boolean>(false);
  const [paymentModeInput, setPaymentModeInput] = useState<"CASH" | "UPI" | "BANK">("CASH");
  const [submittingGenerate, setSubmittingGenerate] = useState<boolean>(false);

  // Mark as Paid Modal state
  const [payRecord, setPayRecord] = useState<SalaryRecord | null>(null);
  const [payMode, setPayMode] = useState<"CASH" | "UPI" | "BANK">("CASH");
  const [submittingPay, setSubmittingPay] = useState<boolean>(false);

  // Print Salary Slip state
  const [printSlipRecord, setPrintSlipRecord] = useState<SalaryRecord | null>(null);

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Fetch Salary Records
  const fetchSalaries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("month", selectedMonth.toString());
      params.set("year", selectedYear.toString());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await apiGet<{ records: SalaryRecord[]; summary: SalarySummary }>(
        `/api/admin/employees/salary?${params.toString()}`
      );
      setSalaryRecords(res.records || []);
      setSummary(res.summary || { count: 0, totalPayout: 0, totalPaid: 0, totalUnpaid: 0 });
    } catch (err: any) {
      toast.error(err?.message || "Failed to load salary records");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, statusFilter]);

  // Fetch Active Staff for generation tab
  const fetchStaffList = useCallback(async () => {
    try {
      const res = await apiGet<StaffItem[]>("/api/admin/employees?status=ACTIVE");
      setStaffList(res || []);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchSalaries();
    fetchStaffList();
  }, [fetchSalaries, fetchStaffList]);

  // Open Generate Modal & load auto-preview
  const handleOpenGenerate = async (staff: StaffItem) => {
    setGenerateStaff(staff);
    setCalcLoading(true);
    setCalcPreview(null);

    try {
      const res = await apiGet<AutoCalculationPreview>(
        `/api/admin/employees/salary/calculate?staffId=${staff.id}&month=${selectedMonth}&year=${selectedYear}`
      );
      setCalcPreview(res);
      setAdvanceCutInput("0");
      setBonusInput("0");
      setDeductionInput(res.deduction.toString());
      setRemarkInput("");
      setMarkPaidInput(false);
      setPaymentModeInput("CASH");
    } catch (err: any) {
      toast.error(err?.message || "Failed to load salary preview");
    } finally {
      setCalcLoading(false);
    }
  };

  // Submit Generate Salary
  const handleConfirmGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateStaff) return;

    // Strict validation: No negative values allowed
    const parsedAdv = parseFloat(advanceCutInput);
    const parsedBon = parseFloat(bonusInput);
    const parsedDed = parseFloat(deductionInput);

    if (
      advanceCutInput.includes("-") ||
      bonusInput.includes("-") ||
      deductionInput.includes("-") ||
      (!isNaN(parsedAdv) && parsedAdv < 0) ||
      (!isNaN(parsedBon) && parsedBon < 0) ||
      (!isNaN(parsedDed) && parsedDed < 0)
    ) {
      toast.error("Negative values are not allowed in Bonus, Deduction, or Advance Cut.");
      return;
    }

    setSubmittingGenerate(true);

    try {
      await apiPost("/api/admin/employees/salary/calculate", {
        staffId: generateStaff.id,
        month: selectedMonth,
        year: selectedYear,
        advanceCut: !isNaN(parsedAdv) ? parsedAdv : 0,
        bonus: !isNaN(parsedBon) ? parsedBon : 0,
        deduction: !isNaN(parsedDed) ? parsedDed : 0,
        remark: remarkInput.trim() || undefined,
        markPaid: markPaidInput,
        paymentMode: markPaidInput ? paymentModeInput : undefined,
      });

      toast.success(`Salary generated for ${generateStaff.name}`);
      setGenerateStaff(null);
      await fetchSalaries();
      setActiveTab("records");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate salary");
    } finally {
      setSubmittingGenerate(false);
    }
  };

  // Mark Salary as Paid
  const handleMarkAsPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payRecord) return;
    setSubmittingPay(true);

    try {
      await apiPut(`/api/admin/employees/salary/${payRecord.id}`, {
        markPaid: true,
        paymentMode: payMode,
      });

      toast.success(`Salary marked as PAID via ${payMode}`);
      setPayRecord(null);
      await fetchSalaries();
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark salary as paid");
    } finally {
      setSubmittingPay(false);
    }
  };

  // Delete Salary Record
  const handleDeleteSalary = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);

    try {
      await apiDelete(`/api/admin/employees/salary/${deleteId}`);
      toast.success("Salary record deleted");
      setDeleteId(null);
      await fetchSalaries();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete salary record");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered records by search
  const filteredRecords = salaryRecords.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.staff?.name?.toLowerCase().includes(q) ||
      r.staff?.staffId?.toLowerCase().includes(q) ||
      r.staff?.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-charcoal-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
              <Link href="/admin" className="hover:text-neon-blue transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/admin/employees" className="hover:text-neon-blue transition-colors">
                Employees
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-200">Payroll & Salary</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading flex items-center gap-2.5">
              <Banknote className="w-7 h-7 text-neon-blue" />
              Salary & Payroll Management
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Automated attendance-based wage calculation, advance recovery, and pay slips
            </p>
          </div>

          {/* Month / Year Picker & Action links */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-charcoal-850 border border-white/10 px-3.5 py-2 rounded-xl text-sm">
              <Calendar className="w-4 h-4 text-neon-blue" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1} className="bg-charcoal-900 text-white">
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer border-l border-white/10 pl-2"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-charcoal-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchSalaries()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-neon-blue" : ""}`} />
            </button>

            <Link
              href="/admin/employees/advances"
              className="px-4 py-2 rounded-xl bg-charcoal-850 border border-gold/30 text-gold text-sm font-semibold hover:bg-gold/10 transition-colors flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Advance Tracker</span>
            </Link>
          </div>
        </div>

        {/* ─── Summary Payout Banner ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-charcoal-850 border border-white/10 space-y-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Total Payroll
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              ₹{summary.totalPayout.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-gray-500">{summary.count} generated records</p>
          </div>

          <div className="p-5 rounded-2xl bg-charcoal-850 border border-emerald-500/20 space-y-1">
            <span className="text-xs text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Paid Amount
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
              ₹{summary.totalPaid.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-gray-500">Disbursed to staff</p>
          </div>

          <div className="p-5 rounded-2xl bg-charcoal-850 border border-amber-500/20 space-y-1">
            <span className="text-xs text-amber-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Pending Payout
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">
              ₹{summary.totalUnpaid.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-gray-500">Awaiting payment</p>
          </div>

          <div className="p-5 rounded-2xl bg-charcoal-850 border border-neon-blue/20 space-y-1">
            <span className="text-xs text-neon-blue uppercase tracking-wider font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Active Staff
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-neon-blue">
              {staffList.length}
            </div>
            <p className="text-xs text-gray-500">Eligible this month</p>
          </div>
        </div>

        {/* ─── Tab Navigation ─── */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab("records")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "records"
                ? "bg-neon-blue text-black shadow-neon-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Salary Records ({summary.count})</span>
          </button>

          <button
            onClick={() => setActiveTab("generate")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "generate"
                ? "bg-neon-blue text-black shadow-neon-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Generate Monthly Salary</span>
          </button>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 1: SALARY RECORDS */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === "records" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-charcoal-850 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search staff by name or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 bg-charcoal-900 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-neon-blue transition-colors"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-charcoal-900 border border-white/10 text-white text-sm focus:outline-none focus:border-neon-blue transition-colors cursor-pointer w-full sm:w-auto"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="PAID">Paid Only</option>
                  <option value="UNPAID">Unpaid (Pending)</option>
                </select>
              </div>
            </div>

            {/* Records Table */}
            <div className="rounded-3xl bg-charcoal-850 border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-charcoal-900/80 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-4">Period</th>
                      <th className="py-4 px-4 text-right">Base Salary</th>
                      <th className="py-4 px-4 text-right">Adv. Cut</th>
                      <th className="py-4 px-4 text-right">Deductions</th>
                      <th className="py-4 px-4 text-right">Bonus</th>
                      <th className="py-4 px-5 text-right font-bold text-white">Net Pay</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((sal) => (
                        <tr key={sal.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Staff */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-charcoal-800 border border-white/10 shrink-0 flex items-center justify-center text-neon-blue font-bold text-sm">
                                {sal.staff?.photo ? (
                                  <Image
                                    src={sal.staff.photo}
                                    alt={sal.staff.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <span>{sal.staff?.name?.slice(0, 2).toUpperCase() || "EM"}</span>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-white">{sal.staff?.name}</div>
                                <div className="text-xs text-gray-400 flex items-center gap-1.5 font-mono">
                                  <span className="text-neon-blue">{sal.staff?.staffId}</span>
                                  <span>•</span>
                                  <span>{sal.staff?.role}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Period */}
                          <td className="py-4 px-4 font-mono text-xs text-gray-300">
                            {MONTH_NAMES[sal.month - 1]?.slice(0, 3)} {sal.year}
                          </td>

                          {/* Base Salary */}
                          <td className="py-4 px-4 text-right font-mono text-gray-300">
                            ₹{sal.baseSalary.toLocaleString("en-IN")}
                          </td>

                          {/* Advance Cut */}
                          <td className="py-4 px-4 text-right font-mono text-amber-400">
                            {sal.advanceCut > 0 ? `-₹${sal.advanceCut.toLocaleString("en-IN")}` : "—"}
                          </td>

                          {/* Deduction */}
                          <td className="py-4 px-4 text-right font-mono text-red-400">
                            {sal.deduction > 0 ? `-₹${sal.deduction.toLocaleString("en-IN")}` : "—"}
                          </td>

                          {/* Bonus */}
                          <td className="py-4 px-4 text-right font-mono text-emerald-400">
                            {sal.bonus > 0 ? `+₹${sal.bonus.toLocaleString("en-IN")}` : "—"}
                          </td>

                          {/* Final Salary */}
                          <td className="py-4 px-5 text-right font-mono font-extrabold text-base text-neon-blue">
                            ₹{sal.finalSalary.toLocaleString("en-IN")}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 text-center">
                            {sal.isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                PAID ({sal.paymentMode || "CASH"})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <Clock className="w-3 h-3" />
                                UNPAID
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!sal.isPaid ? (
                                <button
                                  onClick={() => setPayRecord(sal)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-bold transition-colors"
                                >
                                  Mark Paid
                                </button>
                              ) : null}

                              <button
                                onClick={() => setPrintSlipRecord(sal)}
                                className="p-2 rounded-xl bg-charcoal-900 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-colors"
                                title="Print Salary Slip"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {!sal.isPaid ? (
                                <button
                                  onClick={() => setDeleteId(sal.id)}
                                  className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                                  title="Delete Salary Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-gray-400 space-y-2">
                          <Banknote className="w-10 h-10 mx-auto text-gray-600" />
                          <div className="text-base font-semibold text-gray-300">
                            No salary records found for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                          </div>
                          <p className="text-xs text-gray-500">
                            Switch to &quot;Generate Monthly Salary&quot; tab to compute wages for staff.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 2: GENERATE MONTHLY SALARY */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === "generate" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-charcoal-850 border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">
                  Active Staff Directory for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Click &quot;Generate Salary&quot; to inspect attendance, apply advance cuts, and finalize payout
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-charcoal-850 border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-charcoal-900/80 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-4">Role</th>
                      <th className="py-4 px-4 text-right">Base Wage</th>
                      <th className="py-4 px-4 text-right">Daily Rate</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {staffList.map((st) => {
                      const dailyRate = Math.round(((st.baseSalary || 0) / 30) * 100) / 100;
                      return (
                        <tr key={st.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-charcoal-800 border border-white/10 shrink-0 flex items-center justify-center text-neon-blue font-bold text-sm">
                                {st.photo ? (
                                  <Image
                                    src={st.photo}
                                    alt={st.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <span>{st.name.slice(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-white">{st.name}</div>
                                <div className="text-xs font-mono text-neon-blue">{st.staffId}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-charcoal-900 border border-white/10 text-xs font-medium text-gray-300">
                              {st.role}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right font-mono text-gray-200">
                            ₹{(st.baseSalary || 0).toLocaleString("en-IN")}
                          </td>

                          <td className="py-4 px-4 text-right font-mono text-gray-400 text-xs">
                            ₹{dailyRate}/day
                          </td>

                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleOpenGenerate(st)}
                              className="neon-glow-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto shadow-neon-sm"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Compute & Generate</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* MODAL: COMPUTE & GENERATE SALARY */}
        {/* ────────────────────────────────────────────────────────── */}
        {generateStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              onClick={() => !submittingGenerate && setGenerateStaff(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-xl rounded-3xl glass-panel bg-charcoal-900 border border-white/10 p-6 sm:p-7 shadow-2xl z-10 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-neon-blue" />
                    Salary Generator
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {generateStaff.name} ({generateStaff.staffId}) • {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </p>
                </div>
                <button
                  onClick={() => setGenerateStaff(null)}
                  disabled={submittingGenerate}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {calcLoading ? (
                <div className="py-12 text-center text-gray-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-neon-blue mx-auto" />
                  <p className="text-sm">Calculating attendance & advance balances...</p>
                </div>
              ) : calcPreview ? (
                <form onSubmit={handleConfirmGenerate} className="space-y-4">
                  {calcPreview.isAlreadyGenerated && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Salary for this month has already been generated. Generating again is blocked by unique constraint.
                      </span>
                    </div>
                  )}

                  {/* Attendance Breakdown Card */}
                  <div className="p-4 rounded-2xl bg-charcoal-850 border border-white/5 text-xs space-y-2">
                    <div className="font-semibold text-gray-300 border-b border-white/5 pb-1 flex justify-between">
                      <span>Attendance Summary (30-day base)</span>
                      <span className="text-neon-blue font-mono">Rate: ₹{calcPreview.dailyWage}/day</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                      <div className="p-2 rounded-xl bg-charcoal-900 border border-white/5">
                        <div className="text-emerald-400 font-bold text-base">{calcPreview.presentDays}</div>
                        <div className="text-[11px] text-gray-400">Present/Late</div>
                      </div>
                      <div className="p-2 rounded-xl bg-charcoal-900 border border-white/5">
                        <div className="text-blue-400 font-bold text-base">{calcPreview.halfDays}</div>
                        <div className="text-[11px] text-gray-400">Half Days</div>
                      </div>
                      <div className="p-2 rounded-xl bg-charcoal-900 border border-white/5">
                        <div className="text-red-400 font-bold text-base">{calcPreview.absentDays}</div>
                        <div className="text-[11px] text-gray-400">Absent Days</div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-gray-300 font-semibold mb-1 block">Base Salary</label>
                      <input
                        type="text"
                        disabled
                        value={`₹${calcPreview.baseSalary.toLocaleString("en-IN")}`}
                        className="w-full px-3 py-2 bg-charcoal-850 border border-white/10 rounded-xl text-gray-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-gray-300 font-semibold mb-1 block">
                        Attendance Deduction (Absent/Half Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={deductionInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.includes("-") || parseFloat(val) < 0) {
                            toast.error("Negative deduction is not allowed");
                            return;
                          }
                          setDeductionInput(val);
                        }}
                        className="w-full px-3 py-2 bg-charcoal-850 border border-white/10 rounded-xl text-red-400 font-mono focus:border-neon-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-gray-300 font-semibold">Advance Recovery Cut</label>
                        <span className="text-[10px] text-amber-400 font-mono">
                          Pending: ₹{calcPreview.pendingAdvance}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={calcPreview.pendingAdvance}
                        value={advanceCutInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.includes("-") || parseFloat(val) < 0) {
                            toast.error("Negative advance recovery is not allowed");
                            return;
                          }
                          setAdvanceCutInput(val);
                        }}
                        className="w-full px-3 py-2 bg-charcoal-850 border border-white/10 rounded-xl text-amber-400 font-mono focus:border-neon-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-gray-300 font-semibold mb-1 block">Bonus / Incentive</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={bonusInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.includes("-") || parseFloat(val) < 0) {
                            toast.error("Negative bonus is not allowed");
                            return;
                          }
                          setBonusInput(val);
                        }}
                        className="w-full px-3 py-2 bg-charcoal-850 border border-white/10 rounded-xl text-emerald-400 font-mono focus:border-neon-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Remark */}
                  <div>
                    <label className="text-gray-300 font-semibold text-xs mb-1 block">Remarks / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Festival bonus included, advance cut applied"
                      value={remarkInput}
                      onChange={(e) => setRemarkInput(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-850 border border-white/10 rounded-xl text-white text-xs focus:border-neon-blue focus:outline-none"
                    />
                  </div>

                  {/* Mark Paid Checkbox */}
                  <div className="p-3.5 rounded-2xl bg-charcoal-850 border border-white/5 space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-200">
                      <input
                        type="checkbox"
                        checked={markPaidInput}
                        onChange={(e) => setMarkPaidInput(e.target.checked)}
                        className="rounded bg-charcoal-900 border-white/20 text-neon-blue focus:ring-neon-blue"
                      />
                      <span className="font-semibold">Mark as Paid immediately</span>
                    </label>

                    {markPaidInput && (
                      <div className="flex items-center gap-3 pt-2">
                        <span className="text-gray-400">Payment Mode:</span>
                        {(["CASH", "UPI", "BANK"] as const).map((mode) => (
                          <label key={mode} className="flex items-center gap-1.5 cursor-pointer text-gray-300">
                            <input
                              type="radio"
                              name="payModeRadio"
                              checked={paymentModeInput === mode}
                              onChange={() => setPaymentModeInput(mode)}
                              className="text-neon-blue"
                            />
                            <span>{mode}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Net Payable Banner */}
                  {(() => {
                    const base = calcPreview.baseSalary || 0;
                    const ded = parseFloat(deductionInput) || 0;
                    const adv = parseFloat(advanceCutInput) || 0;
                    const bon = parseFloat(bonusInput) || 0;
                    const net = Math.max(0, Math.round((base - ded - adv + bon) * 100) / 100);

                    return (
                      <div className="p-4 rounded-2xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-400">Estimated Net Payout</div>
                          <div className="text-2xl font-extrabold font-mono text-neon-blue">
                            ₹{net.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={submittingGenerate || calcPreview.isAlreadyGenerated}
                          className="neon-glow-btn px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2 shadow-neon-sm"
                        >
                          {submittingGenerate ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirm & Save</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </form>
              ) : null}
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* MODAL: MARK AS PAID */}
        {/* ────────────────────────────────────────────────────────── */}
        {payRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              onClick={() => !submittingPay && setPayRecord(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-md rounded-3xl glass-panel bg-charcoal-900 border border-white/10 p-6 shadow-2xl z-10 space-y-5">
              <div className="flex items-start justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Disburse Salary
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {payRecord.staff?.name} • Net: ₹{payRecord.finalSalary.toLocaleString("en-IN")}
                  </p>
                </div>
                <button
                  onClick={() => setPayRecord(null)}
                  disabled={submittingPay}
                  className="p-1.5 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleMarkAsPaid} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-2">
                    Select Payment Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["CASH", "UPI", "BANK"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayMode(m)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          payMode === m
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm"
                            : "bg-charcoal-850 text-gray-400 border-white/10 hover:border-white/20"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setPayRecord(null)}
                    disabled={submittingPay}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPay}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center gap-2"
                  >
                    {submittingPay ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* MODAL / PRINT VIEW: SALARY SLIP */}
        {/* ────────────────────────────────────────────────────────── */}
        {printSlipRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-2xl rounded-3xl bg-white text-black p-6 sm:p-8 shadow-2xl z-10 space-y-6 my-auto print:p-0 print:shadow-none print:m-0 print:max-w-full">
              {/* Top Controls (Hidden on Print) */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 print:hidden">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Official Salary Slip Preview
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Slip</span>
                  </button>
                  <button
                    onClick={() => setPrintSlipRecord(null)}
                    className="p-2 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Slip Printable Body */}
              <div className="space-y-6 text-sm">
                {/* Header */}
                <div className="text-center space-y-1 border-b border-gray-300 pb-4">
                  <h2 className="text-xl font-black tracking-tight">{SHOP_CONFIG.name}</h2>
                  <p className="text-xs text-gray-600">{SHOP_CONFIG.address}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    Phone: {SHOP_CONFIG.phone} • Email: {SHOP_CONFIG.email}
                  </p>
                  <div className="inline-block mt-2 px-3 py-1 rounded bg-gray-100 text-xs font-bold font-mono">
                    PAYSLIP FOR {MONTH_NAMES[printSlipRecord.month - 1]?.toUpperCase()} {printSlipRecord.year}
                  </div>
                </div>

                {/* Staff Meta */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-gray-500">Employee Name:</span>
                    <div className="font-bold text-sm text-gray-900">{printSlipRecord.staff?.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Employee ID:</span>
                    <div className="font-bold font-mono text-gray-900">{printSlipRecord.staff?.staffId}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Designation / Role:</span>
                    <div className="font-semibold text-gray-800">{printSlipRecord.staff?.role}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Attendance Days:</span>
                    <div className="font-semibold text-gray-800">
                      {printSlipRecord.presentDays} Present • {printSlipRecord.absentDays} Absent
                    </div>
                  </div>
                </div>

                {/* Earnings & Deductions Table */}
                <div className="border border-gray-300 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 border-b border-gray-300">
                      <tr>
                        <th className="py-2.5 px-4 text-left font-bold">Earnings Component</th>
                        <th className="py-2.5 px-4 text-right font-bold">Amount (₹)</th>
                        <th className="py-2.5 px-4 text-left font-bold border-l border-gray-300">
                          Deductions Component
                        </th>
                        <th className="py-2.5 px-4 text-right font-bold">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-2 px-4">Basic Salary</td>
                        <td className="py-2 px-4 text-right font-mono">
                          ₹{printSlipRecord.baseSalary.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2 px-4 border-l border-gray-300">Attendance Deductions</td>
                        <td className="py-2 px-4 text-right font-mono text-red-600">
                          ₹{printSlipRecord.deduction.toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4">Incentive / Bonus</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-600">
                          ₹{printSlipRecord.bonus.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2 px-4 border-l border-gray-300">Advance / Loan Recovery</td>
                        <td className="py-2 px-4 text-right font-mono text-amber-600">
                          ₹{printSlipRecord.advanceCut.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-300 font-bold">
                      <tr>
                        <td className="py-3 px-4">Total Earnings</td>
                        <td className="py-3 px-4 text-right font-mono">
                          ₹{(printSlipRecord.baseSalary + printSlipRecord.bonus).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 border-l border-gray-300">Total Deductions</td>
                        <td className="py-3 px-4 text-right font-mono">
                          ₹{(printSlipRecord.deduction + printSlipRecord.advanceCut).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Net Pay Box */}
                <div className="p-4 rounded-xl bg-gray-900 text-white flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 uppercase font-semibold">Net Salary Payable</span>
                    <div className="text-xs text-gray-400">
                      Payment Status:{" "}
                      <span className="font-bold text-white">
                        {printSlipRecord.isPaid ? `PAID via ${printSlipRecord.paymentMode}` : "PENDING DISBURSAL"}
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-black font-mono">
                    ₹{printSlipRecord.finalSalary.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="border-t border-gray-400 pt-2 font-semibold">
                    Employee Signature
                  </div>
                  <div className="border-t border-gray-400 pt-2 font-semibold">
                    Authorized Signatory (Patel Car&apos;spa)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title="Delete Salary Record"
          message="Are you sure you want to delete this salary record? This action cannot be undone."
          variant="danger"
          confirmText="Delete Record"
          loading={deleteLoading}
          onConfirm={handleDeleteSalary}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </div>
  );
}
