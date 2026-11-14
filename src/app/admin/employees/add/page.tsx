"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";
import StaffForm from "@/components/admin/employees/StaffForm";
import { apiPost } from "@/lib/api-client";
import type { CreateStaffInput, UpdateStaffInput } from "@/types/staff";

export default function AddStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateStaffInput | UpdateStaffInput) => {
    setLoading(true);

    try {
      await apiPost("/api/admin/employees", data);
      toast.success("Staff member created successfully!");
      router.push("/admin/employees");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to create staff member.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-8 sm:py-12">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Breadcrumbs */}
        <div className="space-y-2">
          <Link
            href="/admin/employees"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-900 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold uppercase tracking-wider transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Staff Directory</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-neon-blue/15 text-neon-blue border border-neon-blue/30 shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">
                Add New Staff Member
              </h1>
              <p className="text-sm text-gray-400">
                Register a new technician, cleaner, or manager for Patel Car&apos;spa.
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 bg-charcoal-850/90 shadow-2xl">
          <StaffForm
            mode="add"
            initialData={{ email: "", name: "", mobile: "", baseSalary: 15000 }}
            loading={loading}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/admin/employees")}
          />
        </div>
      </div>
    </div>
  );
}
