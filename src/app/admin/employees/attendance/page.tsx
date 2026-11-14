"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  QrCode,
  Plus,
  Ban,
  Trash2,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch, apiDelete } from "@/lib/api-client";
import { formatDate } from "@/lib/validators";
import GenerateQRModal from "@/components/admin/employees/GenerateQRModal";
import QRCard from "@/components/admin/employees/QRCard";
import QRHistoryTable from "@/components/admin/employees/QRHistoryTable";
import ConfirmDialog from "@/components/admin/employees/ConfirmDialog";

interface ActiveQRData {
  id: string;
  token: string;
  expiresAt: string;
  expiresIn: number;
  createdAt: string;
  qrImage: string;
  scanURL: string;
  daysRemaining: number;
}

interface QRHistoryItem {
  id: string;
  token: string;
  isActive: boolean;
  expiresAt: string;
  expiresIn: number;
  createdAt: string;
  status: "ACTIVE" | "EXPIRED" | "DEACTIVATED";
}

interface AttendanceQRResponse {
  activeQR: ActiveQRData | null;
  history: QRHistoryItem[];
}

export default function AttendanceQRPage() {
  const [activeQR, setActiveQR] = useState<ActiveQRData | null>(null);
  const [history, setHistory] = useState<QRHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Deactivate Confirm Dialog State
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Delete Confirm Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchQRData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<AttendanceQRResponse>(
        "/api/admin/employees/attendance/qr"
      );
      setActiveQR(res.activeQR);
      setHistory(res.history || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load attendance QR data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQRData();
  }, [fetchQRData]);

  // Periodic auto-refresh every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchQRData();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchQRData]);

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    setActionLoading(true);
    try {
      await apiPatch(`/api/admin/employees/attendance/qr/${deactivateId}`, {
        isActive: false,
      });
      toast.success("Attendance QR deactivated successfully");
      setDeactivateId(null);
      await fetchQRData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to deactivate QR");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await apiDelete(`/api/admin/employees/attendance/qr/${deleteId}`);
      toast.success("QR code record deleted");
      setDeleteId(null);
      await fetchQRData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete QR record");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              <span className="text-gray-200">Attendance QR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading flex items-center gap-2.5">
              <QrCode className="w-7 h-7 text-neon-blue" />
              Attendance QR Management
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Generate, print, and monitor shop-wide QR tokens for staff punch-in
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchQRData()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-charcoal-850 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin text-neon-blue" : ""}`}
              />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-neon-blue text-black hover:bg-neon-hover font-bold text-sm transition-all shadow-neon-sm flex items-center gap-2 active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Generate New QR
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && !activeQR && (
          <div className="p-8 rounded-2xl bg-charcoal-850 border border-white/10 animate-pulse space-y-4">
            <div className="h-6 w-48 bg-white/10 rounded" />
            <div className="h-40 bg-white/5 rounded-xl" />
          </div>
        )}

        {/* Active QR Card / Empty State */}
        {!loading && (
          <QRCard
            qr={activeQR}
            onGenerate={() => setIsModalOpen(true)}
            onDeactivate={(id) => setDeactivateId(id)}
            onRefresh={fetchQRData}
          />
        )}

        {/* QR History Table */}
        <QRHistoryTable
          history={history}
          loading={loading && history.length === 0}
          onDelete={(id) => setDeleteId(id)}
          onDeactivate={(id) => setDeactivateId(id)}
        />
      </div>

      {/* Generate QR Modal */}
      <GenerateQRModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchQRData}
        hasActiveQR={!!activeQR}
      />

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deactivateId}
        title="Deactivate Attendance QR?"
        message="Staff will no longer be able to punch attendance using this QR code until a new one is generated."
        confirmText="Deactivate QR"
        variant="warning"
        loading={actionLoading}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateId(null)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete QR Record?"
        message="This action will permanently delete this historical QR code from the database."
        confirmText="Delete"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
