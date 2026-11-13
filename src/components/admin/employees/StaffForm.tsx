"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { STAFF_ROLES } from "@/lib/constants";
import { isValidMobile, isValidStaffRole } from "@/lib/validators";
import { apiPost, apiPut } from "@/lib/api-client";
import PhotoUpload from "./PhotoUpload";
import type {
  StaffWithStats,
  CreateStaffInput,
  UpdateStaffInput,
  StaffStatus,
} from "@/types/staff";
import { Loader2, Info, ShieldCheck, IndianRupee } from "lucide-react";

interface StaffFormProps {
  mode: "add" | "edit";
  initialData?: Partial<StaffWithStats>;
  staffId?: string;
  onSubmit?: (data: CreateStaffInput | UpdateStaffInput) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function StaffForm({
  mode,
  initialData,
  staffId,
  onSubmit,
  loading: externalLoading = false,
  onCancel,
  onSuccess,
}: StaffFormProps) {
  const router = useRouter();
  const [internalLoading, setInternalLoading] = useState(false);

  // Form State
  const [name, setName] = useState(initialData?.name || "");
  const [mobile, setMobile] = useState(initialData?.mobile || "");
  const [role, setRole] = useState(initialData?.role || STAFF_ROLES[0]);
  const [joiningDate, setJoiningDate] = useState(() => {
    if (initialData?.joiningDate) {
      return new Date(initialData.joiningDate).toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  });
  const [baseSalary, setBaseSalary] = useState(
    initialData?.baseSalary !== undefined ? String(initialData.baseSalary) : "15000"
  );
  const [address, setAddress] = useState(initialData?.address || "");
  const [photo, setPhoto] = useState(initialData?.photo || "");
  const [status, setStatus] = useState<StaffStatus>(initialData?.status || "ACTIVE");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync state if initialData loads asynchronously (Crucial for Edit mode)
  useEffect(() => {
    if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.mobile) setMobile(initialData.mobile);
      if (initialData.role) setRole(initialData.role);
      if (initialData.joiningDate) {
        setJoiningDate(new Date(initialData.joiningDate).toISOString().split("T")[0]);
      }
      if (initialData.baseSalary !== undefined) setBaseSalary(String(initialData.baseSalary));
      if (initialData.address !== undefined) setAddress(initialData.address || "");
      if (initialData.photo !== undefined) setPhoto(initialData.photo || "");
      if (initialData.status) setStatus(initialData.status);
    }
  }, [initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = "Full name must be at least 2 characters.";
    }

    if (!mobile.trim() || !isValidMobile(mobile)) {
      errs.mobile = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210).";
    }

    if (!isValidStaffRole(role)) {
      errs.role = "Please select a valid staff role.";
    }

    if (!joiningDate) {
      errs.joiningDate = "Joining date is required.";
    } else {
      const selectedDate = new Date(joiningDate);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (selectedDate > endOfToday) {
        errs.joiningDate = "Joining date cannot be in the future.";
      }
    }

    const numSalary = Number(baseSalary);
    if (isNaN(numSalary) || numSalary < 0) {
      errs.baseSalary = "Base salary must be a positive number.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isSubmitting = externalLoading || internalLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please correct highlighted errors before submitting.");
      return;
    }

    const payload: CreateStaffInput | UpdateStaffInput = {
      name: name.trim(),
      mobile: mobile.trim().replace(/^(\+91|91)/, ""),
      role: role.trim(),
      joiningDate: new Date(joiningDate).toISOString(),
      baseSalary: Number(baseSalary),
      address: address.trim() || undefined,
      photo: photo.trim() || undefined,
      ...(mode === "edit" ? { status } : {}),
    };

    // If caller provided custom onSubmit handler, use it
    if (onSubmit) {
      await onSubmit(payload);
      return;
    }

    // Default internal API handling:
    setInternalLoading(true);
    try {
      if (mode === "edit") {
        const targetId = staffId || initialData?.id || initialData?.staffId;
        if (!targetId) {
          throw new Error("Missing Staff ID for update operation.");
        }
        await apiPut(`/api/admin/employees/${targetId}`, payload);
        toast.success("Staff profile updated successfully!");
      } else {
        await apiPost("/api/admin/employees", payload);
        toast.success("Staff member registered successfully!");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/employees");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || `Failed to ${mode === "edit" ? "update" : "create"} staff.`);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Left Column: Identity & Employment */}
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Patel"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              className="w-full px-4 py-3 bg-charcoal-900 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-neon-blue/60 focus:ring-1 focus:ring-neon-blue/60 transition-all"
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Mobile Number (Login ID) <span className="text-red-400">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-semibold text-gray-400 select-none">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setMobile(cleaned);
                  if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: "" }));
                }}
                className="w-full pl-12 pr-4 py-3 bg-charcoal-900 border border-white/10 rounded-xl text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-neon-blue/60 focus:ring-1 focus:ring-neon-blue/60 transition-all"
              />
            </div>
            {errors.mobile && (
              <p className="text-xs text-red-400 mt-1">{errors.mobile}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Designation / Role <span className="text-red-400">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (errors.role) setErrors((prev) => ({ ...prev, role: "" }));
              }}
              className="w-full px-4 py-3 bg-charcoal-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-neon-blue/60 focus:ring-1 focus:ring-neon-blue/60 transition-all"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r} className="bg-charcoal-900 text-white">
                  {r}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-xs text-red-400 mt-1">{errors.role}</p>
            )}
          </div>

          {/* Joining Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Joining Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              max={new Date().toISOString().split("T")[0]}
              value={joiningDate}
              onChange={(e) => {
                setJoiningDate(e.target.value);
                if (errors.joiningDate) setErrors((prev) => ({ ...prev, joiningDate: "" }));
              }}
              className="w-full px-4 py-3 bg-charcoal-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-neon-blue/60 focus:ring-1 focus:ring-neon-blue/60 transition-all [color-scheme:dark]"
            />
            {errors.joiningDate && (
              <p className="text-xs text-red-400 mt-1">{errors.joiningDate}</p>
            )}
          </div>
        </div>

        {/* Right Column: Photo, Compensation & Address */}
        <div className="space-y-5">
          {/* Photo URL */}
          <PhotoUpload value={photo} onChange={(url) => setPhoto(url)} />

          {/* Base Salary */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Monthly Base Salary (₹) <span className="text-red-400">*</span>
            </label>
            <div className="relative flex items-center">
              <IndianRupee className="absolute left-3.5 w-4 h-4 text-gray-400" />
              <input
                type="number"
                required
                min={0}
                step={500}
                placeholder="15000"
                value={baseSalary}
                onChange={(e) => {
                  setBaseSalary(e.target.value);
                  if (errors.baseSalary) setErrors((prev) => ({ ...prev, baseSalary: "" }));
                }}
                className="w-full pl-11 pr-4 py-3 bg-charcoal-900 border border-white/10 rounded-xl text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-neon-blue/60 focus:ring-1 focus:ring-neon-blue/60 transition-all"
              />
            </div>
            {errors.baseSalary && (
              <p className="text-xs text-red-400 mt-1">{errors.baseSalary}</p>
            )}
          </div>

          {/* Status (Edit Mode Only) */}
          {mode === "edit" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Employment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StaffStatus)}
                className="w-full px-4 py-3 bg-charcoal-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-neon-blue/60 focus:ring-1 focus:ring-neon-blue/60 transition-all"
              >
                <option value="ACTIVE" className="bg-charcoal-900 text-emerald-400">
                  ACTIVE
                </option>
                <option value="ON_LEAVE" className="bg-charcoal-900 text-amber-400">
                  ON_LEAVE
                </option>
                <option value="INACTIVE" className="bg-charcoal-900 text-gray-400">
                  INACTIVE (Deactivated)
                </option>
              </select>
            </div>
          )}

          {/* Residential Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Residential Address (Optional)
            </label>
            <textarea
              rows={mode === "edit" ? 2 : 3}
              placeholder="House/Street, Village, Taluka, District..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-neon-blue/60 focus:ring-1 focus:ring-neon-blue/60 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-2xl bg-charcoal-900 border border-white/10 flex items-start gap-3 text-xs text-gray-300">
        <Info className="w-4 h-4 text-neon-blue shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-white">Default Login Credentials</p>
          <p className="text-gray-400 pt-0.5">
            Default password is staff member&apos;s 10-digit mobile number. Staff can change their password after logging in via the Employee Portal.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-white/5">
        {onCancel && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-gray-300 hover:text-white border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold neon-glow-btn flex items-center justify-center gap-2 shadow-neon-md disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          <span>{mode === "add" ? "Save & Create Staff" : "Update Staff Details"}</span>
        </button>
      </div>
    </form>
  );
}
