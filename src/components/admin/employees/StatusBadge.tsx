import React from "react";
import type { StaffStatus } from "@/types/staff";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: StaffStatus | string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = (status || "ACTIVE").toUpperCase();

  const styles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    ACTIVE: {
      bg: "bg-emerald-500/10 border-emerald-500/30",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
      label: "Active",
    },
    INACTIVE: {
      bg: "bg-gray-500/10 border-gray-500/30",
      text: "text-gray-400",
      dot: "bg-gray-400",
      label: "Inactive",
    },
    ON_LEAVE: {
      bg: "bg-amber-500/10 border-amber-500/30",
      text: "text-amber-400",
      dot: "bg-amber-400",
      label: "On Leave",
    },
  };

  const current = styles[normalized] || {
    bg: "bg-gray-500/10 border-gray-500/30",
    text: "text-gray-300",
    dot: "bg-gray-400",
    label: normalized,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors",
        current.bg,
        current.text,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", current.dot)} />
      {current.label}
    </span>
  );
}
