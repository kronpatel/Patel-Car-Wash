"use client";

import React from "react";
import Image from "next/image";
import { User, Edit, KeyRound, Trash2, Calendar, Phone, Briefcase } from "lucide-react";
import type { StaffWithStats } from "@/types/staff";
import StatusBadge from "./StatusBadge";
import { formatDate } from "@/lib/validators";

interface StaffTableProps {
  staff: StaffWithStats[];
  onEdit: (member: StaffWithStats) => void;
  onDelete: (member: StaffWithStats) => void;
  onResetPassword: (member: StaffWithStats) => void;
  loading?: boolean;
}

export default function StaffTable({
  staff,
  onEdit,
  onDelete,
  onResetPassword,
  loading = false,
}: StaffTableProps) {
  if (loading) {
    return (
      <div className="glass-panel rounded-2xl border border-white/10 bg-charcoal-850/80 p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-charcoal-800/60 animate-pulse flex items-center justify-between px-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-charcoal-700" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-charcoal-700 rounded" />
                <div className="w-20 h-3 bg-charcoal-700 rounded" />
              </div>
            </div>
            <div className="w-24 h-6 bg-charcoal-700 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="glass-panel rounded-3xl border border-white/10 bg-charcoal-850/60 p-12 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-charcoal-800/80 border border-white/5 mx-auto flex items-center justify-center text-gray-500">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-heading font-bold text-white">No Staff Members Found</h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          No employee matches your current filters. Clear the search or register a new team member.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl border border-white/10 bg-charcoal-850/90 shadow-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-charcoal-900/60 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <th className="py-4 px-5">Staff Member</th>
              <th className="py-4 px-4">Staff ID</th>
              <th className="py-4 px-4">Role</th>
              <th className="py-4 px-4">Contact</th>
              <th className="py-4 px-4">Joining Date</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {staff.map((member) => (
              <tr
                key={member.id}
                onClick={() => onEdit(member)}
                className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
              >
                {/* Photo & Name */}
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-charcoal-800 border border-white/10 shrink-0 flex items-center justify-center text-gray-400">
                      {member.photo ? (
                        <Image
                          src={member.photo}
                          alt={member.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white group-hover:text-neon-blue transition-colors">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        ₹{Number(member.baseSalary || 0).toLocaleString("en-IN")}/mo
                      </p>
                    </div>
                  </div>
                </td>

                {/* Staff ID */}
                <td className="py-3.5 px-4">
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-charcoal-900 border border-white/10 text-gray-300">
                    {member.staffId}
                  </span>
                </td>

                {/* Role */}
                <td className="py-3.5 px-4 text-gray-300">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                    <Briefcase className="w-3.5 h-3.5 text-gold" />
                    {member.role}
                  </span>
                </td>

                {/* Contact */}
                <td className="py-3.5 px-4 font-mono text-xs text-gray-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    +91 {member.mobile}
                  </span>
                </td>

                {/* Joining Date */}
                <td className="py-3.5 px-4 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {formatDate(member.joiningDate)}
                  </span>
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4">
                  <StatusBadge status={member.status} />
                </td>

                {/* Actions */}
                <td
                  className="py-3.5 px-5 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(member)}
                      title="Edit Staff"
                      className="p-2 rounded-xl text-gray-400 hover:text-neon-blue hover:bg-neon-blue/10 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onResetPassword(member)}
                      title="Reset Password to Mobile"
                      className="p-2 rounded-xl text-gray-400 hover:text-gold hover:bg-gold/10 transition-colors"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    {member.status !== "INACTIVE" && (
                      <button
                        type="button"
                        onClick={() => onDelete(member)}
                        title="Deactivate Staff"
                        className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
