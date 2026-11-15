"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileBarChart,
  Users,
  Calendar,
  Banknote,
  CreditCard,
  Download,
  Printer,
  RefreshCw,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet } from "@/lib/api-client";
import { SHOP_CONFIG } from "@/lib/constants";

type ReportType = "staff_directory" | "monthly_attendance" | "salary_payout" | "advances";

interface ReportStaffItem {
  id: string;
  staffId: string;
  name: string;
  role: string;
  mobile: string;
  email?: string | null;
  status: string;
  joiningDate?: string | Date;
  baseSalary?: number;
  presentDaysThisMonth?: number;
  absentDaysThisMonth?: number;
  totalPendingAdvance?: number;
  thisMonthSalary?: number;
  attendanceStats?: {
    presentDays?: number;
    absentDays?: number;
    attendanceRate?: number;
  };
}

interface ReportSalaryItem {
  id: string;
  staffId: string;
  month: number;
  year: number;
  baseSalary: number;
  advanceCut: number;
  deduction: number;
  bonus: number;
  finalSalary: number;
  isPaid: boolean;
  paymentMode?: string | null;
  staff?: {
    staffId: string;
    name: string;
    role: string;
  };
}

interface ReportAdvanceItem {
  id: string;
  staffId: string;
  amountGiven: number;
  amountRecovered: number;
  remainingBalance: number;
  date: string | Date;
  status: string;
  reason?: string | null;
  staff?: {
    staffId: string;
    name: string;
    role: string;
  };
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

export default function ReportsPage() {
  const currentDate = new Date();
  const [reportType, setReportType] = useState<ReportType>("staff_directory");
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [loading, setLoading] = useState<boolean>(true);
  const [staffData, setStaffData] = useState<ReportStaffItem[]>([]);
  const [salaryData, setSalaryData] = useState<ReportSalaryItem[]>([]);
  const [advanceData, setAdvanceData] = useState<ReportAdvanceItem[]>([]);

  // Fetch all necessary data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [staffRes, salaryRes, advanceRes] = await Promise.all([
        apiGet<ReportStaffItem[]>("/api/admin/employees"),
        apiGet<{ records: ReportSalaryItem[] }>(`/api/admin/employees/salary?month=${selectedMonth}&year=${selectedYear}`),
        apiGet<{ records: ReportAdvanceItem[] }>("/api/admin/employees/advances"),
      ]);

      setStaffData(staffRes || []);
      setSalaryData(salaryRes?.records || []);
      setAdvanceData(advanceRes?.records || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load report data";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CSV Export Generator (with UTF-8 BOM for Excel)
  const handleExportCSV = () => {
    let filename = "";
    let csvContent = "\uFEFF"; // UTF-8 BOM

    if (reportType === "staff_directory") {
      filename = `Patel_Car_Spa_Staff_Directory_${new Date().toISOString().split("T")[0]}.csv`;
      csvContent += "Staff ID,Name,Role,Mobile,Email,Status,Joining Date,Base Salary (INR)\n";
      staffData.forEach((s) => {
        csvContent += `"${s.staffId}","${s.name}","${s.role}","${s.mobile}","${s.email || ""}","${s.status}","${
          s.joiningDate ? new Date(s.joiningDate).toLocaleDateString("en-IN") : ""
        }","${s.baseSalary || 0}"\n`;
      });
    } else if (reportType === "monthly_attendance") {
      filename = `Patel_Car_Spa_Attendance_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`;
      csvContent += "Staff ID,Name,Role,Month,Year,Present Days,Absent Days,Monthly Attendance Rate\n";
      staffData.forEach((s) => {
        const present = s.presentDaysThisMonth ?? s.attendanceStats?.presentDays ?? 0;
        const absent = s.absentDaysThisMonth ?? s.attendanceStats?.absentDays ?? 0;
        const total = present + absent;
        const rate = total > 0 ? Math.round((present / total) * 100) : (present > 0 ? 100 : 0);
        csvContent += `"${s.staffId}","${s.name}","${s.role}","${MONTH_NAMES[selectedMonth - 1]}","${selectedYear}","${present}","${absent}","${rate}%"\n`;
      });
    } else if (reportType === "salary_payout") {
      filename = `Patel_Car_Spa_Salary_Payout_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`;
      csvContent += "Staff ID,Name,Role,Month,Year,Base Salary,Advance Cut,Deductions,Bonus,Final Net Salary,Status,Payment Mode\n";
      salaryData.forEach((sal) => {
        csvContent += `"${sal.staff?.staffId}","${sal.staff?.name}","${sal.staff?.role}","${MONTH_NAMES[sal.month - 1]}","${sal.year}","${
          sal.baseSalary
        }","${sal.advanceCut}","${sal.deduction}","${sal.bonus}","${sal.finalSalary}","${
          sal.isPaid ? "PAID" : "UNPAID"
        }","${sal.paymentMode || "N/A"}"\n`;
      });
    } else if (reportType === "advances") {
      filename = `Patel_Car_Spa_Advances_Tracker_${new Date().toISOString().split("T")[0]}.csv`;
      csvContent += "Staff ID,Name,Role,Date Issued,Amount Given (INR),Amount Recovered (INR),Remaining Balance (INR),Status,Reason\n";
      advanceData.forEach((adv) => {
        csvContent += `"${adv.staff?.staffId}","${adv.staff?.name}","${adv.staff?.role}","${
          new Date(adv.date).toLocaleDateString("en-IN")
        }","${adv.amountGiven}","${adv.amountRecovered}","${adv.remainingBalance}","${adv.status}","${
          adv.reason?.replace(/"/g, '""') || ""
        }"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV report downloaded successfully");
  };

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
              <span className="text-gray-200">Reports</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading flex items-center gap-2.5">
              <FileBarChart className="w-7 h-7 text-neon-blue" />
              Employee Reports & Analytics
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Export comprehensive staff directories, attendance logs, salary disbursements, and loan summaries
            </p>
          </div>

          {/* Export Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {(reportType === "monthly_attendance" || reportType === "salary_payout") && (
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
            )}

            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-gray-300 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-neon-blue" : ""}`} />
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-white hover:border-neon-blue hover:text-neon-blue text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-neon-blue text-black font-bold text-sm hover:bg-neon-hover transition-colors flex items-center gap-2 shadow-neon-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* ─── Report Selection Tabs ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
          <button
            onClick={() => setReportType("staff_directory")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              reportType === "staff_directory"
                ? "bg-neon-blue/15 border-neon-blue text-white shadow-neon-sm"
                : "bg-charcoal-850 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200"
            }`}
          >
            <Users className="w-5 h-5 mb-2 text-neon-blue" />
            <div className="font-bold text-sm text-white">Staff Directory</div>
            <div className="text-xs text-gray-500 mt-0.5">Roster, wages, joined dates</div>
          </button>

          <button
            onClick={() => setReportType("monthly_attendance")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              reportType === "monthly_attendance"
                ? "bg-neon-blue/15 border-neon-blue text-white shadow-neon-sm"
                : "bg-charcoal-850 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200"
            }`}
          >
            <Calendar className="w-5 h-5 mb-2 text-emerald-400" />
            <div className="font-bold text-sm text-white">Monthly Attendance</div>
            <div className="text-xs text-gray-500 mt-0.5">Present, absent, rate %</div>
          </button>

          <button
            onClick={() => setReportType("salary_payout")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              reportType === "salary_payout"
                ? "bg-neon-blue/15 border-neon-blue text-white shadow-neon-sm"
                : "bg-charcoal-850 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200"
            }`}
          >
            <Banknote className="w-5 h-5 mb-2 text-gold" />
            <div className="font-bold text-sm text-white">Salary Payout</div>
            <div className="text-xs text-gray-500 mt-0.5">Wages, cuts, bonuses, net pay</div>
          </button>

          <button
            onClick={() => setReportType("advances")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              reportType === "advances"
                ? "bg-neon-blue/15 border-neon-blue text-white shadow-neon-sm"
                : "bg-charcoal-850 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200"
            }`}
          >
            <CreditCard className="w-5 h-5 mb-2 text-amber-400" />
            <div className="font-bold text-sm text-white">Advance & Loans</div>
            <div className="text-xs text-gray-500 mt-0.5">Issued vs recovered balances</div>
          </button>
        </div>

        {/* ─── Printable Document Header (shows in Print) ─── */}
        <div className="hidden print:block text-black p-4 text-center border-b border-gray-300 space-y-1">
          <h2 className="text-2xl font-bold">{SHOP_CONFIG.name}</h2>
          <p className="text-xs">{SHOP_CONFIG.address} • {SHOP_CONFIG.phone}</p>
          <div className="text-sm font-bold uppercase tracking-wider pt-2">
            {reportType === "staff_directory" && "Master Staff Directory Report"}
            {reportType === "monthly_attendance" && `Monthly Attendance Report — ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
            {reportType === "salary_payout" && `Salary Disbursement Report — ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
            {reportType === "advances" && "Staff Advances & Loan Balances Report"}
          </div>
        </div>

        {/* ─── Report Tables ─── */}
        <div className="rounded-3xl bg-charcoal-850 border border-white/10 overflow-hidden shadow-xl print:border-none print:bg-white print:text-black">
          <div className="overflow-x-auto">
            {/* 1. Staff Directory Report */}
            {reportType === "staff_directory" && (
              <table className="w-full text-left text-sm print:text-xs">
                <thead className="bg-charcoal-900 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="py-4 px-6">Staff Code</th>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-4">Role</th>
                    <th className="py-4 px-4">Mobile</th>
                    <th className="py-4 px-4">Joined Date</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Base Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-gray-200">
                  {staffData.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-6 font-mono text-neon-blue font-bold print:text-black">{s.staffId}</td>
                      <td className="py-3.5 px-6 font-semibold text-white print:text-black">{s.name}</td>
                      <td className="py-3.5 px-4 text-gray-300 print:text-black">{s.role}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-400 print:text-black">{s.mobile}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-400 print:text-black">
                        {s.joiningDate ? new Date(s.joiningDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold print:border print:border-black">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-bold text-white print:text-black">
                        ₹{(s.baseSalary || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. Monthly Attendance Report */}
            {reportType === "monthly_attendance" && (
              <table className="w-full text-left text-sm print:text-xs">
                <thead className="bg-charcoal-900 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="py-4 px-6">Staff Code</th>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-4">Role</th>
                    <th className="py-4 px-4 text-right">Present Days</th>
                    <th className="py-4 px-4 text-right">Absent Days</th>
                    <th className="py-4 px-6 text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-gray-200">
                  {staffData.map((s) => {
                    const present = s.presentDaysThisMonth ?? s.attendanceStats?.presentDays ?? 0;
                    const absent = s.absentDaysThisMonth ?? s.attendanceStats?.absentDays ?? 0;
                    const total = present + absent;
                    const rate = total > 0 ? Math.round((present / total) * 100) : (present > 0 ? 100 : 0);
                    return (
                      <tr key={s.id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-6 font-mono text-neon-blue font-bold print:text-black">{s.staffId}</td>
                        <td className="py-3.5 px-6 font-semibold text-white print:text-black">{s.name}</td>
                        <td className="py-3.5 px-4 text-gray-300 print:text-black">{s.role}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-400 print:text-black">
                          {present}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-red-400 print:text-black">
                          {absent}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono font-bold text-neon-blue print:text-black">
                          {rate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* 3. Salary Payout Report */}
            {reportType === "salary_payout" && (
              <table className="w-full text-left text-sm print:text-xs">
                <thead className="bg-charcoal-900 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="py-4 px-6">Employee</th>
                    <th className="py-4 px-4 text-right">Base</th>
                    <th className="py-4 px-4 text-right">Adv. Cut</th>
                    <th className="py-4 px-4 text-right">Deductions</th>
                    <th className="py-4 px-4 text-right">Bonus</th>
                    <th className="py-4 px-5 text-right font-bold">Net Payout</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4 text-center">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-gray-200">
                  {salaryData.length > 0 ? (
                    salaryData.map((sal) => (
                      <tr key={sal.id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-6">
                          <span className="font-semibold text-white print:text-black">{sal.staff?.name}</span>
                          <span className="text-xs text-gray-400 font-mono ml-2">({sal.staff?.staffId})</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono">₹{sal.baseSalary.toLocaleString("en-IN")}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-amber-400 print:text-black">
                          {sal.advanceCut > 0 ? `-₹${sal.advanceCut}` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-red-400 print:text-black">
                          {sal.deduction > 0 ? `-₹${sal.deduction}` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-400 print:text-black">
                          {sal.bonus > 0 ? `+₹${sal.bonus}` : "—"}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-extrabold text-neon-blue print:text-black">
                          ₹{sal.finalSalary.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs font-bold">
                          {sal.isPaid ? (
                            <span className="text-emerald-400 print:text-black">PAID</span>
                          ) : (
                            <span className="text-amber-400 print:text-black">UNPAID</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs font-mono text-gray-400 print:text-black">
                          {sal.paymentMode || "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        No salary records generated for this month yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 4. Advance & Loans Report */}
            {reportType === "advances" && (
              <table className="w-full text-left text-sm print:text-xs">
                <thead className="bg-charcoal-900 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="py-4 px-6">Employee</th>
                    <th className="py-4 px-4">Date Issued</th>
                    <th className="py-4 px-4 text-right">Amount Given</th>
                    <th className="py-4 px-4 text-right">Recovered</th>
                    <th className="py-4 px-4 text-right font-bold">Remaining Balance</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-6">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-gray-200">
                  {advanceData.map((adv) => (
                    <tr key={adv.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-6">
                        <span className="font-semibold text-white print:text-black">{adv.staff?.name}</span>
                        <span className="text-xs text-gray-400 font-mono ml-2">({adv.staff?.staffId})</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-gray-400 print:text-black">
                        {new Date(adv.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">₹{adv.amountGiven.toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400 print:text-black">
                        ₹{adv.amountRecovered.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400 print:text-black">
                        ₹{adv.remainingBalance.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold ${
                            adv.status === "OPEN"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-emerald-500/15 text-emerald-400"
                          }`}
                        >
                          {adv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-xs text-gray-300 max-w-[200px] truncate print:text-black">
                        {adv.reason || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
