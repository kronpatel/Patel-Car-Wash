"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertOctagon,
  HelpCircle,
  Search,
  RefreshCw,
  ChevronRight,
  QrCode,
  Edit3,
  Filter,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet } from "@/lib/api-client";
import { getISTDateString } from "@/lib/timezone";
import ManualAttendanceModal, {
  StaffSummaryForAttendance,
} from "@/components/admin/employees/ManualAttendanceModal";

interface AttendanceRecord {
  id: string;
  staffId: string;
  name: string;
  role: string;
  photo: string | null;
  mobile: string;
  email: string | null;
  status: "PRESENT" | "LATE" | "ABSENT" | "HALF_DAY" | "LEAVE" | "NOT_MARKED";
  inTime: string | null;
  outTime: string | null;
  method: "QR" | "MANUAL" | null;
  remark: string | null;
  attendanceId: string | null;
}

interface AttendanceStats {
  totalStaff: number;
  present: number;
  late: number;
  absent: number;
  halfDay?: number;
  leave?: number;
  notMarked: number;
}

export default function AttendanceListPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getISTDateString());
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Manual mark modal state
  const [modalStaff, setModalStaff] = useState<StaffSummaryForAttendance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch Attendance & Stats
  const fetchData = useCallback(async (showToast = false) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);

      const [recordsRes, statsRes] = await Promise.all([
        apiGet<AttendanceRecord[]>(`/api/admin/employees/attendance?${params.toString()}`),
        apiGet<AttendanceStats>(`/api/admin/employees/attendance/stats?date=${selectedDate}`),
      ]);

      setRecords(recordsRes || []);
      setStats(statsRes);

      if (showToast) {
        toast.success("Attendance directory refreshed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load attendance directory");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open manual mark modal
  const handleOpenManualModal = (record: AttendanceRecord) => {
    setModalStaff({
      id: record.id,
      staffId: record.staffId,
      name: record.name,
      role: record.role,
      photo: record.photo,
    });
    setIsModalOpen(true);
  };

  // Status Badge Styling Helper
  const renderStatusBadge = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "PRESENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PRESENT
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            LATE
          </span>
        );
      case "HALF_DAY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Clock className="w-3.5 h-3.5" />
            HALF DAY
          </span>
        );
      case "LEAVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Calendar className="w-3.5 h-3.5" />
            ON LEAVE
          </span>
        );
      case "ABSENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertOctagon className="w-3.5 h-3.5" />
            ABSENT
          </span>
        );
      case "NOT_MARKED":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30">
            <HelpCircle className="w-3.5 h-3.5" />
            NOT MARKED
          </span>
        );
    }
  };

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
              <Link
                href="/admin/employees"
                className="hover:text-neon-blue transition-colors"
              >
                Employees
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link
                href="/admin/employees/attendance"
                className="hover:text-neon-blue transition-colors"
              >
                Attendance QR
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-200">Daily Attendance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading flex items-center gap-2.5">
              <UserCheck className="w-7 h-7 text-neon-blue" />
              Attendance Directory
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Live daily attendance log, status monitoring, and admin manual override
            </p>
          </div>

          {/* Date Picker & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-charcoal-850 border border-white/10 px-3.5 py-2 rounded-xl text-sm shadow-sm">
              <Calendar className="w-4 h-4 text-neon-blue" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={loading}
              className="p-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-colors"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin text-neon-blue" : ""}`}
              />
            </button>

            <Link
              href="/admin/employees/attendance"
              className="px-4 py-2.5 rounded-xl bg-charcoal-850 border border-gold/30 text-gold text-sm font-semibold hover:bg-gold/10 transition-colors flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Attendance QR</span>
            </Link>
          </div>
        </div>

        {/* ─── 4 Stats Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Staff */}
          <div className="p-5 rounded-2xl bg-charcoal-850 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Staff
              </span>
              <Users className="w-4 h-4 text-neon-blue" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {stats?.totalStaff ?? 0}
            </div>
            <p className="text-xs text-gray-500">Active studio roster</p>
          </div>

          {/* 2. Present */}
          <div className="p-5 rounded-2xl bg-charcoal-850 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Present
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
              {stats?.present ?? 0}
            </div>
            <p className="text-xs text-gray-500">Punched in & verified</p>
          </div>

          {/* 3. Late */}
          <div className="p-5 rounded-2xl bg-charcoal-850 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Late Mark
              </span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">
              {stats?.late ?? 0}
            </div>
            <p className="text-xs text-gray-500">Punched after 09:30 AM</p>
          </div>

          {/* 4. Absent / Not Marked */}
          <div className="p-5 rounded-2xl bg-charcoal-850 border border-red-500/20 space-y-2">
            <div className="flex items-center justify-between text-red-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Absent / Unmarked
              </span>
              <AlertOctagon className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-red-400">
              {(stats?.absent ?? 0) + (stats?.notMarked ?? 0)}
            </div>
            <p className="text-xs text-gray-500">
              {stats?.notMarked ?? 0} unmarked • {stats?.absent ?? 0} absent
            </p>
          </div>
        </div>

        {/* ─── Search & Status Filters ─── */}
        <div className="p-4 rounded-2xl bg-charcoal-850 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, ID, or phone..."
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
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="LEAVE">On Leave</option>
              <option value="ABSENT">Absent</option>
              <option value="NOT_MARKED">Not Marked</option>
            </select>
          </div>
        </div>

        {/* ─── Table of Daily Attendance ─── */}
        <div className="rounded-3xl bg-charcoal-850 border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-charcoal-900/80 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">In Time</th>
                  <th className="py-4 px-6">Method</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.length > 0 ? (
                  records.map((r) => {
                    const formattedInTime = r.inTime
                      ? new Date(r.inTime).toLocaleTimeString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—";

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Employee Name & Staff ID */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-charcoal-800 border border-white/10 shrink-0 flex items-center justify-center text-neon-blue font-bold text-sm">
                              {r.photo ? (
                                <Image
                                  src={r.photo}
                                  alt={r.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <span>{r.name.slice(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-white">
                                {r.name}
                              </div>
                              <div className="text-xs font-mono text-neon-blue">
                                {r.staffId}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-lg bg-charcoal-900 border border-white/10 text-xs font-medium text-gray-300">
                            {r.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">{renderStatusBadge(r.status)}</td>

                        {/* In Time */}
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs text-gray-300">
                            {formattedInTime}
                          </span>
                        </td>

                        {/* Method */}
                        <td className="py-4 px-6">
                          {r.method === "QR" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-neon-blue">
                              <QrCode className="w-3.5 h-3.5" />
                              QR Scan
                            </span>
                          ) : r.method === "MANUAL" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gold">
                              <Edit3 className="w-3.5 h-3.5" />
                              Manual Admin
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-6 text-right">
                          {r.status === "NOT_MARKED" ? (
                            <button
                              onClick={() => handleOpenManualModal(r)}
                              className="px-3.5 py-1.5 rounded-xl bg-neon-blue/15 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/25 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Mark Manual</span>
                            </button>
                          ) : (
                            <span
                              className="text-xs text-gray-500 italic truncate max-w-[150px] inline-block"
                              title={r.remark || "Marked"}
                            >
                              {r.remark || "Recorded"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-gray-400 space-y-2"
                    >
                      <UserCheck className="w-10 h-10 mx-auto text-gray-600" />
                      <div className="text-base font-semibold text-gray-300">
                        No staff found for this date.
                      </div>
                      <p className="text-xs text-gray-500">
                        Try changing the selected date or clear your search filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Manual Attendance Modal ─── */}
        <ManualAttendanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          staff={modalStaff}
          date={selectedDate}
          onSuccess={() => fetchData(false)}
        />
      </div>
    </div>
  );
}
