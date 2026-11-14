"use client";

import React from "react";
import { Trash2, Ban, History, ShieldAlert } from "lucide-react";

export interface QRHistoryItem {
  id: string;
  createdAt: string;
  expiresAt: string;
  expiresIn: number;
  isActive: boolean;
  status: "ACTIVE" | "EXPIRED" | "DEACTIVATED";
}

interface QRHistoryTableProps {
  history: QRHistoryItem[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  onDeactivate?: (id: string) => void;
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export default function QRHistoryTable({
  history,
  loading = false,
  onDelete,
  onDeactivate,
}: QRHistoryTableProps) {
  const getStatusBadge = (status: QRHistoryItem["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-400 border border-gray-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Expired
          </span>
        );
      case "DEACTIVATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Deactivated
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-charcoal-850 border border-white/10 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-heading">
              QR History
            </h3>
            <p className="text-xs text-gray-400">
              Audit log of previously generated attendance tokens (last 20)
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400 font-mono px-2.5 py-1 rounded-md bg-charcoal-900 border border-white/5">
          Total: {history.length}
        </span>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 bg-white/5 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : history.length === 0 ? (
        /* Empty State */
        <div className="py-12 text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-300">
            No QR history yet
          </p>
          <p className="text-xs text-gray-500">
            Generated attendance codes will appear here automatically.
          </p>
        </div>
      ) : (
        /* Table Layout */
        <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-sm min-w-[620px]">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 w-12">#</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Expires Date</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {history.map((item, index) => {
                const canDelete = !item.isActive;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-3.5 px-3 text-xs text-gray-500 font-mono">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 whitespace-nowrap">
                      {formatDateTime(item.expiresAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-mono text-neon-blue font-semibold">
                        {item.expiresIn} days
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {item.isActive ? (
                        <button
                          type="button"
                          onClick={() => onDeactivate?.(item.id)}
                          className="text-xs text-red-400 hover:text-red-300 hover:underline inline-flex items-center gap-1 font-medium transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onDelete?.(item.id)}
                          disabled={!canDelete}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
