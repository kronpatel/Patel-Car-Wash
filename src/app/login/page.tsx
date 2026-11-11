"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Car,
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res) {
        setErrorMessage("Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }

      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage("Authentication failed. Please check your network.");
      setIsLoading(false);
    }
  };

  const handleDemoAdminFill = () => {
    setEmail("admin@cleanpro.com");
    setPassword("CleanProAdmin@2024!");
    setErrorMessage("");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Icon & Heading */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-charcoal-850 border border-neon-blue/40 flex items-center justify-center shadow-neon-sm group-hover:border-neon-blue transition-colors">
            <Car className="w-6 h-6 text-neon-blue group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-heading font-extrabold text-2xl tracking-tight text-white flex items-center gap-1">
            Clean<span className="text-neon-blue">Pro</span>
            <Sparkles className="w-4 h-4 text-gold" />
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
          Welcome Back
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Access your bookings, loyalty rewards &amp; Clean Coins
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow Element */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-neon-blue/15 rounded-full blur-2xl pointer-events-none" />

        {/* Successful Registration Flash Notice */}
        {registered && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Account registered successfully! Please log in below.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm placeholder:text-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Password with Show/Hide Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Password
              </label>
              <span className="text-xs text-gray-400">
                Min. 6 characters
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 rounded-xl glass-input text-sm placeholder:text-gray-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full neon-glow-btn py-3.5 rounded-xl font-heading font-semibold text-sm flex items-center justify-center gap-2 shadow-neon-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to CleanPro</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Trigger */}
        <div className="mt-6 pt-5 border-t border-white/5 text-center">
          <p className="text-xs text-gray-400 mb-2">
            Testing CleanPro Admin Workstation?
          </p>
          <button
            type="button"
            onClick={handleDemoAdminFill}
            className="text-xs font-semibold text-gold hover:text-gold-light hover:underline inline-flex items-center gap-1 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fill Demo Admin Credentials</span>
          </button>
        </div>
      </div>

      {/* Redirect to Sign Up */}
      <p className="text-center text-sm text-gray-400 mt-6">
        Don&apos;t have an account yet?{" "}
        <Link
          href="/signup"
          className="text-neon-blue font-semibold hover:underline"
        >
          Create Customer Account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[140px] pointer-events-none" />

      <Suspense
        fallback={
          <div className="glass-panel p-8 rounded-3xl text-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-neon-blue mx-auto mb-2" />
            <span>Loading login...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
