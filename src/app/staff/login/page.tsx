"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Lock, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error("Please enter email/mobile and password");
      return;
    }

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: identifier.trim(), // NextAuth authorize handles email or mobile
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Login successful! Welcome to Staff Portal.");
        router.push("/staff/dashboard"); // Staff portal dashboard
        router.refresh();
      }
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal-950 px-4 py-12 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-blue/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl bg-charcoal-850 border border-white/10 shadow-2xl relative z-10 backdrop-blur-sm">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue shadow-neon-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-1 font-heading">
          Staff Portal
        </h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Login with Email / Mobile & Password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">
              Email or Mobile
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="staff@example.com or 9876543210"
                required
                autoComplete="username"
                className="w-full pl-10 pr-3 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors"
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
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-neon-blue text-black font-semibold rounded-lg hover:bg-neon-hover disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-neon-sm active:scale-[0.99]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Logging in..." : "Login to Portal"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/5 text-center space-y-2 text-xs text-gray-400">
          <p>
            Admin?{" "}
            <Link href="/login" className="text-neon-blue hover:underline font-medium">
              Admin Login
            </Link>
          </p>
          <p>
            Customer?{" "}
            <Link href="/login" className="text-neon-blue hover:underline font-medium">
              Customer Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
