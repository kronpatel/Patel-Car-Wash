"use client";

import React, { useState } from "react";
import {
  Tag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  History,
  Edit2,
  Trash2,
  Power,
  Calendar,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { IPromoCode } from "@/types";
import { formatINR, cn } from "@/lib/utils";
import PromoHistoryModal from "./PromoHistoryModal";
import PromoFormModal from "./PromoFormModal";

export interface PromoWithStats extends IPromoCode {
  usedCount?: number;
  computedStatus?: "active" | "expired" | "inactive";
}

interface PromosManagerProps {
  initialPromos: PromoWithStats[];
}

export default function PromosManager({ initialPromos }: PromosManagerProps) {
  const [promos, setPromos] = useState<PromoWithStats[]>(initialPromos);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "expired" | "inactive"
  >("all");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<IPromoCode | null>(null);
  const [historyPromo, setHistoryPromo] = useState<IPromoCode | null>(null);

  // Notice & action loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchPromos = async () => {
    try {
      const res = await fetch("/api/admin/promos");
      const data = await res.json();
      if (data.success && Array.isArray(data.promos)) {
        setPromos(data.promos);
      }
    } catch {
      setNotice({ type: "error", text: "Failed to refresh promo codes" });
    }
  };

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (promo: PromoWithStats) => {
    setEditingPromo(promo);
    setFormModalOpen(true);
  };

  const handleOpenHistory = (promo: PromoWithStats) => {
    setHistoryPromo(promo);
  };

  const handleSaved = (savedPromo: IPromoCode) => {
    setNotice({
      type: "success",
      text: `Promo code "${savedPromo.code}" saved successfully`,
    });
    fetchPromos();
  };

  // Toggle active/inactive directly from the list view
  const handleToggleActive = async (promo: PromoWithStats) => {
    const promoId = promo.id || promo._id;
    if (!promoId) return;

    setActionLoadingId(promoId);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/promos/${promoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotice({
          type: "error",
          text: data.error || "Failed to update status",
        });
      } else {
        setNotice({
          type: "success",
          text: `Promo code "${promo.code}" is now ${
            !promo.isActive ? "ACTIVE" : "INACTIVE"
          }`,
        });
        setPromos((prev) =>
          prev.map((p) =>
            (p.id || p._id) === promoId
              ? {
                  ...p,
                  isActive: !promo.isActive,
                  computedStatus: !promo.isActive ? "active" : "inactive",
                }
              : p
          )
        );
      }
    } catch {
      setNotice({ type: "error", text: "Network error updating status" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete promo code
  const handleDelete = async (promo: PromoWithStats) => {
    const promoId = promo.id || promo._id;
    if (!promoId) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete promo code "${promo.code}"?`
    );
    if (!confirmed) return;

    setActionLoadingId(promoId);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/promos/${promoId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setNotice({
          type: "error",
          text: data.error || "Failed to delete promo code",
        });
      } else {
        setNotice({
          type: "success",
          text: `Promo code "${promo.code}" deleted successfully`,
        });
        setPromos((prev) => prev.filter((p) => (p.id || p._id) !== promoId));
      }
    } catch {
      setNotice({ type: "error", text: "Network error deleting promo code" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtering
  const filteredPromos = promos.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = q === "" || p.code.toLowerCase().includes(q);

    const isExpired = p.expiryDate && new Date(p.expiryDate) < new Date();
    const currentStatus = !p.isActive
      ? "inactive"
      : isExpired
      ? "expired"
      : "active";

    const matchesStatus =
      statusFilter === "all" ? true : currentStatus === statusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm ${
            notice.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/15 border border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs hover:underline uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code (e.g. FIRST50)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs font-mono uppercase"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 p-1 rounded-xl glass-panel border border-white/10 text-xs">
            {(
              [
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "expired", label: "Expired" },
                { id: "inactive", label: "Inactive" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === f.id
                    ? "bg-neon-blue text-charcoal-950 shadow-neon-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchPromos}
            title="Refresh promo list"
            className="p-2.5 rounded-xl glass-panel text-gray-300 hover:text-neon-blue border border-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Primary CTA: Create Promo */}
        <button
          onClick={handleOpenCreate}
          className="neon-glow-btn px-5 py-2.5 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-neon-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo Code</span>
        </button>
      </div>

      {/* Noir Table Container */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300 border-collapse">
            <thead>
              <tr className="bg-charcoal-850/90 text-gray-400 uppercase tracking-wider font-semibold border-b border-white/10 text-[10px]">
                <th className="py-4 px-5">Promo Code</th>
                <th className="py-4 px-5">Discount</th>
                <th className="py-4 px-5">Per-User Limit</th>
                <th className="py-4 px-5">Total Used</th>
                <th className="py-4 px-5">Expiry Date</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPromos.length > 0 ? (
                filteredPromos.map((p) => {
                  const promoId = p.id || p._id || "";
                  const isLoading = actionLoadingId === promoId;
                  const isExpired =
                    p.expiryDate && new Date(p.expiryDate) < new Date();
                  const computedStatus = !p.isActive
                    ? "inactive"
                    : isExpired
                    ? "expired"
                    : "active";

                  const expiryStr = p.expiryDate
                    ? new Date(p.expiryDate).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })
                    : "Never";

                  return (
                    <tr
                      key={promoId}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Code */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm tracking-wider px-2.5 py-1 rounded-lg bg-charcoal-800 border border-white/10">
                            {p.code}
                          </span>
                        </div>
                        {p.minBookingAmount ? (
                          <p className="text-[10px] text-gray-500 mt-1">
                            Min. order: ₹{p.minBookingAmount}
                          </p>
                        ) : null}
                      </td>

                      {/* Discount */}
                      <td className="py-4 px-5">
                        <div className="font-heading font-bold text-white text-sm">
                          {p.discountType === "FLAT"
                            ? `₹${p.discountValue} OFF`
                            : `${p.discountValue}% OFF`}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {p.discountType === "FLAT" ? "Flat Rupee" : "Percentage"}
                        </span>
                      </td>

                      {/* KEY FIX: Per-User Limit */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-gold shrink-0" />
                          <span className="font-mono font-semibold text-white">
                            {p.usageLimitPerUser}x
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {p.usageLimitPerUser === 1
                              ? "(Once per user)"
                              : "per user"}
                          </span>
                        </div>
                      </td>

                      {/* Total Used */}
                      <td className="py-4 px-5">
                        <button
                          type="button"
                          onClick={() => handleOpenHistory(p)}
                          className="group flex items-center gap-1.5 hover:underline"
                          title="Click to view redemption audit trail"
                        >
                          <span className="font-mono font-bold text-neon-blue">
                            {p.usedCount || 0} times
                          </span>
                          {p.totalUsageLimit ? (
                            <span className="text-gray-500 font-mono text-[10px]">
                              / {p.totalUsageLimit}
                            </span>
                          ) : null}
                          <History className="w-3 h-3 text-gray-500 group-hover:text-neon-blue transition-colors" />
                        </button>
                      </td>

                      {/* Expiry */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>{expiryStr}</span>
                        </div>
                        {isExpired && (
                          <p className="text-[10px] text-red-400 mt-0.5">
                            Expired
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                            computedStatus === "active" &&
                              "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                            computedStatus === "expired" &&
                              "bg-red-500/15 text-red-400 border-red-500/30",
                            computedStatus === "inactive" &&
                              "bg-gray-500/15 text-gray-400 border-gray-500/30"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              computedStatus === "active" && "bg-emerald-400",
                              computedStatus === "expired" && "bg-red-400",
                              computedStatus === "inactive" && "bg-gray-500"
                            )}
                          />
                          <span className="capitalize">{computedStatus}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* History Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenHistory(p)}
                            title="View redemption history"
                            className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-750 text-gray-300 hover:text-gold border border-white/10 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            title="Edit promo code configuration"
                            className="px-2.5 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-750 text-gray-200 hover:text-neon-blue border border-white/10 text-[11px] font-medium flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {/* Toggle Active */}
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleToggleActive(p)}
                            title={
                              p.isActive
                                ? "Deactivate promo code"
                                : "Activate promo code"
                            }
                            className={`p-1.5 rounded-lg border transition-colors ${
                              p.isActive
                                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
                                : "bg-gray-800 text-gray-500 hover:text-gray-300 border-white/10"
                            }`}
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleDelete(p)}
                            title="Delete promo code"
                            className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No promo codes found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Audit Modal */}
      {historyPromo && (
        <PromoHistoryModal
          promo={historyPromo}
          onClose={() => setHistoryPromo(null)}
        />
      )}

      {/* Create / Edit Form Modal */}
      {formModalOpen && (
        <PromoFormModal
          promo={editingPromo}
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setEditingPromo(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
