"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  QrCode,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { getCurrentLocation, isWithinShopRadius, isSuspiciousLocation } from "@/lib/location";
import { apiPost } from "@/lib/api-client";
import { SHOP_ATTENDANCE_RADIUS_METERS } from "@/lib/constants";

type UIState =
  | "loading"
  | "invalid_token"
  | "location_error"
  | "outside_radius"
  | "suspicious_location"
  | "form"
  | "submitting"
  | "success";

interface SuccessData {
  staff: {
    name: string;
    staffId: string;
    role: string;
  };
  attendance: {
    status: string;
    inTime: string;
    distanceMeters?: number;
    remark?: string;
  };
}

function ScanPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  // State
  const [uiState, setUiState] = useState<UIState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  // Form Fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Success Data
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [formattedPunchTime, setFormattedPunchTime] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(3);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Location Verification
  const verifyLocation = useCallback(async () => {
    // 1. Check if token is present
    if (!token || !token.trim()) {
      setUiState("invalid_token");
      setErrorMessage("Invalid QR. Please scan again.");
      return;
    }

    setUiState("loading");
    setErrorMessage("");

    try {
      // 2. Call getCurrentLocation() from @/lib/location
      const position = await getCurrentLocation();
      setCoords({
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
      });

      // 2.1. Check for Fake GPS / Mock Location apps
      const suspiciousCheck = isSuspiciousLocation(position.accuracy);
      if (suspiciousCheck.isSuspicious) {
        setUiState("suspicious_location");
        setErrorMessage(
          suspiciousCheck.reason ||
            "Location verification failed. Please turn off Fake GPS / Mock Location apps and try again."
        );
        return;
      }

      // 3. Check shop radius
      const radiusCheck = isWithinShopRadius(position.latitude, position.longitude);
      setDistanceMeters(radiusCheck.distance);

      if (!radiusCheck.isWithin) {
        setUiState("outside_radius");
        setErrorMessage(
          `You are out of shop area (${Math.round(radiusCheck.distance)}m away). Please come inside.`
        );
        return;
      }

      // Location is inside shop radius!
      setUiState("form");
    } catch (err: any) {
      setUiState("location_error");
      setErrorMessage(
        err?.message || "Location permission denied. Please allow location access."
      );
    }
  }, [token]);

  useEffect(() => {
    verifyLocation();
  }, [verifyLocation]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      toast.error("Please enter Email/Mobile and Password.");
      return;
    }

    if (!coords || !token) {
      toast.error("GPS coordinates or QR token missing. Please retry.");
      return;
    }

    setUiState("submitting");

    try {
      // 1. Call POST /api/staff/scan
      const response = await apiPost<{
        success: boolean;
        data: SuccessData;
        message?: string;
      }>("/api/staff/scan", {
        token: token.trim(),
        identifier: identifier.trim(),
        password,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });

      const result = (response as any).data || response;

      // 2. Call signIn("credentials", ...) to set session cookie
      await signIn("credentials", {
        email: identifier.trim(),
        password,
        redirect: false,
      });

      // 3. Format punch time (in IST)
      const inTimeDate = result.attendance?.inTime
        ? new Date(result.attendance.inTime)
        : new Date();
      const timeStr = inTimeDate.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      setFormattedPunchTime(timeStr);
      setSuccessData(result);
      setUiState("success");
      toast.success(response.message || "Attendance marked successfully!");

      // 4. Redirect to /staff/dashboard after 3 seconds
      let counter = 3;
      timerRef.current = setInterval(() => {
        counter -= 1;
        setCountdown(counter);
        if (counter <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          router.push("/staff/dashboard");
        }
      }, 1000);
    } catch (err: any) {
      setUiState("form");
      toast.error(err?.message || "Failed to mark attendance. Please check credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-white flex items-center justify-center p-4 py-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-blue/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          {/* ─── 1. Loading State ─── */}
          {uiState === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 rounded-3xl bg-charcoal-850 border border-white/10 shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-neon-blue mx-auto shadow-neon-sm">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h2 className="text-xl font-bold font-heading text-white">
                Verifying your location...
              </h2>
              <p className="text-sm text-gray-400">
                Checking GPS proximity to Patel Car&apos;spa Studio Rankuva...
              </p>
            </motion.div>
          )}

          {/* ─── 2. Invalid Token Screen ─── */}
          {uiState === "invalid_token" && (
            <motion.div
              key="invalid_token"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 rounded-3xl bg-charcoal-850 border border-red-500/30 shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <XCircle className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-bold text-white font-heading">
                Invalid QR Code
              </h2>
              <p className="text-sm text-red-300 font-medium">{errorMessage}</p>
              <p className="text-xs text-gray-400">
                Make sure you scan the official QR code displayed at Patel Car&apos;spa Studio.
              </p>
              <div className="pt-2">
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-sm font-semibold hover:border-white/20 transition-all text-gray-300 hover:text-white"
                >
                  Go to Main Login
                </a>
              </div>
            </motion.div>
          )}

          {/* ─── 3. Location / GPS Error Screen ─── */}
          {uiState === "location_error" && (
            <motion.div
              key="location_error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 rounded-3xl bg-charcoal-850 border border-red-500/30 shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <XCircle className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-bold text-white font-heading">
                Location Error
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">{errorMessage}</p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={verifyLocation}
                  className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-400 transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Location Check
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── 3.1. Suspicious / Mock Location Screen ─── */}
          {uiState === "suspicious_location" && (
            <motion.div
              key="suspicious_location"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 rounded-3xl bg-charcoal-850 border border-red-500/40 shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(239,68,68,0.3)]">
                <ShieldAlert className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-bold text-white font-heading">
                Mock Location Detected
              </h2>
              <p className="text-sm text-red-300 font-medium leading-relaxed">
                {errorMessage ||
                  "Location verification failed. Please turn off Fake GPS / Mock Location apps and try again."}
              </p>
              <p className="text-xs text-gray-400">
                Attendance can only be marked using genuine device GPS inside Patel Car&apos;spa Studio.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={verifyLocation}
                  className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-400 transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Location Check
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── 4. Outside Shop Area Screen ─── */}
          {uiState === "outside_radius" && (
            <motion.div
              key="outside_radius"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 rounded-3xl bg-charcoal-850 border border-red-500/40 shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                <MapPin className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-bold text-white font-heading">
                Out of Shop Area
              </h2>
              <p className="text-sm text-red-300 font-medium leading-relaxed">
                {errorMessage}
              </p>

              {distanceMeters !== null && (
                <div className="p-3.5 rounded-2xl bg-charcoal-900 border border-red-500/20 text-center space-y-1">
                  <div className="text-red-400 font-extrabold text-lg font-mono">
                    ~{Math.round(distanceMeters)}m away
                  </div>
                  <div className="text-xs text-gray-400">
                    Maximum allowed radius: {SHOP_ATTENDANCE_RADIUS_METERS}m of studio
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={verifyLocation}
                  className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-400 transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Location Check
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── 5. Inside Shop & Login Form ─── */}
          {(uiState === "form" || uiState === "submitting") && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-6 sm:p-8 rounded-3xl bg-charcoal-850 border border-white/10 shadow-2xl backdrop-blur-md space-y-5"
            >
              {/* Top Banner / Verification Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue shadow-neon-sm">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-heading text-white">
                      Staff Attendance
                    </h2>
                    <p className="text-xs text-gray-400">
                      Patel Car&apos;spa Studio • Rankuva
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Inside Shop ({distanceMeters ?? 0}m)
                </span>
              </div>

              {/* Login & Mark Attendance Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 block">
                    Email or Mobile
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Email or Mobile"
                      required
                      autoComplete="username"
                      disabled={uiState === "submitting"}
                      className="w-full pl-10 pr-3 py-2.5 bg-charcoal-900 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      autoComplete="current-password"
                      disabled={uiState === "submitting"}
                      className="w-full pl-10 pr-10 py-2.5 bg-charcoal-900 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uiState === "submitting"}
                  className="w-full mt-2 py-3 bg-neon-blue text-black font-bold text-sm rounded-xl hover:bg-neon-hover disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-neon-sm active:scale-98"
                >
                  {uiState === "submitting" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Marking Attendance...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Login & Mark Attendance</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center text-xs text-gray-500 pt-2 border-t border-white/5">
                Patel Car&apos;spa Geo-Protected Punch Terminal
              </div>
            </motion.div>
          )}

          {/* ─── 6. Green Success Screen ─── */}
          {uiState === "success" && successData && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-3xl bg-charcoal-850 border border-emerald-500/40 shadow-2xl text-center space-y-5"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-bold font-heading text-white">
                  ✅ Attendance Marked! {formattedPunchTime} — {successData.attendance.status}
                </h2>
                <p className="text-sm text-gray-300 mt-2">
                  Welcome, <span className="font-semibold text-white">{successData.staff.name}</span> ({successData.staff.staffId})
                </p>
              </div>

              {/* Punch-in Summary Details */}
              <div className="p-4 rounded-2xl bg-charcoal-900 border border-white/5 text-xs space-y-2 text-left">
                <div className="flex justify-between text-gray-400">
                  <span>Role:</span>
                  <span className="font-semibold text-gray-200">{successData.staff.role}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Status:</span>
                  <span
                    className={`font-semibold font-mono ${
                      successData.attendance.status === "LATE"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {successData.attendance.status}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Punch Time:</span>
                  <span className="font-semibold text-neon-blue font-mono">
                    {formattedPunchTime}
                  </span>
                </div>
                {successData.attendance.distanceMeters !== undefined && (
                  <div className="flex justify-between text-gray-400">
                    <span>Proximity:</span>
                    <span className="font-semibold text-emerald-400">
                      {successData.attendance.distanceMeters}m from studio center
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <span>Redirecting to Staff Dashboard in</span>
                <span className="font-mono text-neon-blue font-bold text-sm">
                  {countdown}s
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neon-blue" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function StaffScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-charcoal-950 flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
        </div>
      }
    >
      <ScanPageContent />
    </Suspense>
  );
}
