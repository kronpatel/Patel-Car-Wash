import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base Glassmorphic Skeleton Component
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-charcoal-750/60 border border-white/5",
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton for Service Grid Cards
 */
export function ServiceCardSkeleton() {
  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-72 border border-white/5">
      <div className="flex items-center justify-between">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="w-3/4 h-6 rounded-md" />
        <Skeleton className="w-full h-4 rounded-md" />
        <Skeleton className="w-5/6 h-4 rounded-md" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <Skeleton className="w-20 h-4 rounded-md" />
        <Skeleton className="w-28 h-9 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton for Booking List Rows
 */
export function BookingRowSkeleton() {
  return (
    <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 border border-white/5">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-5 rounded-md" />
          <Skeleton className="w-24 h-4 rounded-md" />
        </div>
      </div>
      <Skeleton className="w-24 h-7 rounded-full" />
      <Skeleton className="w-28 h-9 rounded-lg" />
    </div>
  );
}

/**
 * Skeleton for Pricing Plan Cards
 */
export function PlanCardSkeleton() {
  return (
    <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between h-[480px] border border-white/5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="w-36 h-7 rounded-lg" />
          <Skeleton className="w-20 h-6 rounded-full" />
        </div>
        <Skeleton className="w-full h-4 rounded-md" />
        <Skeleton className="w-28 h-10 rounded-xl mt-4" />
        <div className="space-y-3 pt-6 border-t border-white/5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="w-5/6 h-4 rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="w-full h-12 rounded-xl mt-6" />
    </div>
  );
}

/**
 * Skeleton for Dashboard Stat Tiles
 */
export function StatsCardSkeleton() {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4 rounded-md" />
        <Skeleton className="w-9 h-9 rounded-xl" />
      </div>
      <Skeleton className="w-32 h-8 rounded-lg" />
      <Skeleton className="w-20 h-3 rounded-md" />
    </div>
  );
}

export default Skeleton;
