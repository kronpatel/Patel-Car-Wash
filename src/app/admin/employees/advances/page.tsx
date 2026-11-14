"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";
import ConfirmDialog from "@/components/admin/employees/ConfirmDialog";

interface StaffItem {
  id: string;
  staffId: string;
  name: string;
  role: string;
  photo: string | null;
  baseSalary?: number;
}

interface AdvanceRecord {
  id: string;
  staffId: string;
  amountGiven: number;
  amountRecovered: number;
  remainingBalance: number;
  reason: string | null;
  date: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  staff: {
    id: string;
    staffId: string;
    name: string;
    role: string;
    photo: string | null;
    mobile: string;
  };
}

export default function AdvanceTrackerPage() {
  const [advances, setAdvances] = useState<AdvanceRecord[]>([]);
  const [summary, setSummary] = useState({ count: 0, totalGiven: 0, totalRecovered: 0, totalRemaining: 0 });
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [amountGiven, setAmountGiven] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [advanceDate, setAdvanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Fetch Advances
  const fetchAdvances = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await apiGet<{ records: AdvanceRecord[]; summary: any }>(
        `/api/admin/employees/advances?${params.toString()}`
      );
      setAdvances(res.records || []);
      setSummary(res.summary || { count: 0, totalGiven: 0, totalRecovered: 0, totalRemaining: 0 });

      if (showToast) {
        toast.success("Advances list refreshed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load advances");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch Active Staff
  const fetchStaff = useCallback(async () => {
    try {
      const res = await apiGet<StaffItem[]>("/api/admin/employees?status=ACTIVE");
      setStaffList(res || []);
      if (res && res.length > 0 && !selectedStaffId) {
        setSelectedStaffId(res[0].id);
      }
    } catch (err: any) {
      console.error(err);
    }
  }, [selectedStaffId]);

  useEffect(() => {
    fetchAdvances();
    fetchStaff();
  }, [fetchAdvances, fetchStaff]);

  // Handle Create Advance
  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      toast.error("Please select a staff member");
      return;
    }

    const amount = parseFloat(amountGiven);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive advance amount");
      return;
    }

    setSubmittingCreate(true);
    try {
      await apiPost("/api/admin/employees/advances", {
        staffId: selectedStaffId,
        amountGiven: amount,
        reason: reason.trim() || undefined,
        date: advanceDate,
      });

      toast.success("Advance granted successfully");
      setIsModalOpen(false);
      setAmountGiven("");
      setReason("");
      await fetchAdvances();
    } catch (err: any) {
      toast.error(err?.message || "Failed to grant advance");
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Handle Delete Advance
  const handleDeleteAdvance = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);

    try {
      await apiDelete(`/api/admin/employees/advances/${deleteId}`);
      toast.success("Advance record deleted");
      setDeleteId(null);
      await fetchAdvances();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete advance record");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter advances by search text
  const filteredAdvances = advances.filter((adv) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      adv.staff?.name?.toLowerCase().includes(q) ||
      adv.staff?.staffId?.toLowerCase().includes(q) ||
      adv.staff?.role?.toLowerCase().includes(q) ||
      adv.reason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-charcoal-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Breadcrumb */}
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
              <span className="text-gray-200">Advance Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading flex items-center gap-2.5">
              <CreditCard className="w-7 h-7 text-neon-blue" />
              Staff Advance & Loan Tracker
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Issue advance payments, track balance recovery, and monitor repayment status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchAdvances(true)}
              disabled={loading}
              className="p-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-neon-blue" : ""}`} />
            </button>

            <Link
              href="/admin/employees/salary"
              className="px-4 py-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-gray-300 text-sm font-semibold hover:border-white/20 transition-colors flex items-center gap-2"
            >
              <Banknote className="w-4 h-4 text-neon-blue" />
              <span>Salary Hub</span>
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="neon-glow-btn px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-neon-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Give New Advance</span>
            </button>
          </div>
        </div>

        {/* ─── Summary Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-charcoal-850 border border-white/10 space-y-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Total Advances Granted
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              ₹{summary.totalGiven.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-gray-500">{summary.count} advance records</p>
          </div>

          <div className="p-5 rounded-2xl bg-charcoal-850 border border-emerald-500/20 space-y-1">
            <span className="text-xs text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Total Recovered
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
              ₹{summary.totalRecovered.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-gray-500">Deducted from monthly payroll</p>
          </div>

          <div className="p-5 rounded-2xl bg-charcoal-850 border border-amber-500/20 space-y-1">
            <span className="text-xs text-amber-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Pending Balance
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">
              ₹{summary.totalRemaining.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-gray-500">Yet to be recovered</p>
          </div>

          <div className="p-5 rounded-2xl bg-charcoal-850 border border-neon-blue/20 space-y-1">
            <span className="text-xs text-neon-blue uppercase tracking-wider font-semibold">
              Open Loans
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-neon-blue">
              {advances.filter((a) => a.status === "OPEN").length}
            </div>
            <p className="text-xs text-gray-500">Active repayment accounts</p>
          </div>
        </div>

        {/* ─── Search & Filters ─── */}
        <div className="p-4 rounded-2xl bg-charcoal-850 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by staff, role, or reason..."
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
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open (Pending Balance)</option>
              <option value="CLOSED">Closed (Fully Recovered)</option>
            </select>
          </div>
        </div>

        {/* ─── Advances Table ─── */}
        <div className="rounded-3xl bg-charcoal-850 border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-charcoal-900/80 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4 text-right">Amount Given</th>
                  <th className="py-4 px-4 text-right">Recovered</th>
                  <th className="py-4 px-4 text-right font-bold text-white">Remaining Balance</th>
                  <th className="py-4 px-6">Reason / Note</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAdvances.length > 0 ? (
                  filteredAdvances.map((adv) => (
                    <tr key={adv.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Staff */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-charcoal-800 border border-white/10 shrink-0 flex items-center justify-center text-neon-blue font-bold text-sm">
                            {adv.staff?.photo ? (
                              <Image
                                src={adv.staff.photo}
                                alt={adv.staff.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <span>{adv.staff?.name?.slice(0, 2).toUpperCase() || "EM"}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{adv.staff?.name}</div>
                            <div className="text-xs text-gray-400 font-mono">
                              <span className="text-neon-blue">{adv.staff?.staffId}</span> • {adv.staff?.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-xs font-mono text-gray-300">
                        {new Date(adv.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Amount Given */}
                      <td className="py-4 px-4 text-right font-mono text-gray-200">
                        ₹{adv.amountGiven.toLocaleString("en-IN")}
                      </td>

                      {/* Recovered */}
                      <td className="py-4 px-4 text-right font-mono text-emerald-400">
                        ₹{adv.amountRecovered.toLocaleString("en-IN")}
                      </td>

                      {/* Remaining Balance */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-amber-400">
                        ₹{adv.remainingBalance.toLocaleString("en-IN")}
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-6 text-xs text-gray-300 max-w-[200px] truncate" title={adv.reason || ""}>
                        {adv.reason || "—"}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {adv.status === "OPEN" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            OPEN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            CLOSED
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setDeleteId(adv.id)}
                          className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete Advance Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 space-y-2">
                      <CreditCard className="w-10 h-10 mx-auto text-gray-600" />
                      <div className="text-base font-semibold text-gray-300">No advance records found</div>
                      <p className="text-xs text-gray-500">
                        Click &quot;Give New Advance&quot; above to issue an advance payment to staff.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── MODAL: GIVE NEW ADVANCE ─── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              onClick={() => !submittingCreate && setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-lg rounded-3xl glass-panel bg-charcoal-900 border border-white/10 p-6 sm:p-7 shadow-2xl z-10 space-y-5">
              <div className="flex items-start justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-neon-blue" />
                    Issue New Advance
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Advance is automatically tracked and recovered during monthly salary computation
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={submittingCreate}
                  className="p-1.5 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAdvance} className="space-y-4">
                {/* Staff Selection */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Select Staff Member
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    disabled={submittingCreate}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-white text-sm focus:outline-none focus:border-neon-blue"
                  >
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id} className="bg-charcoal-900 text-white">
                        {st.name} ({st.staffId}) • {st.role} • Base: ₹{(st.baseSalary || 0).toLocaleString("en-IN")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount Given */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Advance Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="e.g. 5000"
                    value={amountGiven}
                    onChange={(e) => setAmountGiven(e.target.value)}
                    disabled={submittingCreate}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-neon-blue"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Date of Issue
                  </label>
                  <input
                    type="date"
                    value={advanceDate}
                    onChange={(e) => setAdvanceDate(e.target.value)}
                    disabled={submittingCreate}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-white text-sm focus:outline-none focus:border-neon-blue cursor-pointer"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Reason / Purpose (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Medical emergency, Family function"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={submittingCreate}
                    maxLength={200}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-white text-sm focus:outline-none focus:border-neon-blue"
                  />
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submittingCreate}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingCreate}
                    className="neon-glow-btn px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-neon-sm"
                  >
                    {submittingCreate ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Issue Advance</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title="Delete Advance Record"
          message="Are you sure you want to delete this advance record? This will remove the liability from the staff member."
          variant="danger"
          confirmText="Delete Advance"
          loading={deleteLoading}
          onConfirm={handleDeleteAdvance}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </div>
  );
}
