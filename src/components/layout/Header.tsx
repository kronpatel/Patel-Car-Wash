"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Sparkles,
  Menu,
  X,
  User,
  LogOut,
  ShieldAlert,
  Calendar,
  ChevronDown,
  Users,
} from "lucide-react";
import CoinBadge from "@/components/ui/CoinBadge";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Location", href: "/#location" },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Monitor scroll position to apply glassmorphic backdrop
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Close desktop user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userRole = session?.user?.role;
  const userCoins = session?.user?.cleanCoins ?? 0;
  const isEmployeesActive = pathname?.startsWith("/admin/employees");
  const isAdminActive = pathname === "/admin" || pathname?.startsWith("/admin/promos");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        isScrolled
          ? "bg-charcoal-950/90 backdrop-blur-md border-b border-white/10 shadow-lg py-3"
          : "bg-transparent py-4 sm:py-5"
      )}
    >
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex items-center justify-between">
          {/* Left: Brand Logo + Desktop Navigation Links */}
          <div className="flex items-center gap-8 lg:gap-10">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center group bg-transparent shrink-0">
              <Image
                src="/logo/logo.svg"
                alt="Patel Car'spa & Detailing Studio"
                width={170}
                height={57}
                priority
                className="object-contain h-8 sm:h-10 md:h-12 w-auto max-w-[140px] sm:max-w-[170px] drop-shadow-[0_0_1px_rgba(255,255,255,0.7)] transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation Links — Left Aligned, Clean & No Pill Container */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-sm font-medium transition-colors relative py-1",
                      isActive
                        ? "text-neon-blue font-semibold"
                        : "text-gray-300 hover:text-white"
                    )}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-neon-blue rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Cluster (Coins, User / Auth, Book CTA) */}
          <div className="hidden md:flex items-center gap-3">
            {session?.user ? (
              <div className="flex items-center gap-2.5" ref={userMenuRef}>
                {/* Clean Coins Badge */}
                <Link href="/dashboard" title="View your Clean Coins rewards">
                  <CoinBadge coins={userCoins} size="sm" />
                </Link>

                {/* User Dropdown Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="true"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-charcoal-800/80 hover:bg-charcoal-750 border border-white/10 text-sm text-gray-200 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-neon-blue/20 text-neon-blue flex items-center justify-center font-semibold text-xs">
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="max-w-[110px] truncate font-medium">
                      {session.user.name}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 text-gray-400 transition-transform duration-200",
                        isUserMenuOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel p-2 shadow-2xl border border-white/10 z-50"
                      >
                        <div className="px-3 py-2 border-b border-white/5 mb-1">
                          <p className="text-xs text-gray-400">Signed in as</p>
                          <p className="text-sm font-semibold text-white truncate">
                            {session.user.email}
                          </p>
                        </div>

                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <User className="w-4 h-4 text-neon-blue" />
                          <span>My Dashboard</span>
                        </Link>

                        {userRole === "admin" && (
                          <>
                            <Link
                              href="/admin"
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors",
                                isAdminActive
                                  ? "text-gold bg-gold/15 font-semibold"
                                  : "text-gold hover:text-gold-light hover:bg-gold/10"
                              )}
                            >
                              <ShieldAlert className="w-4 h-4 text-gold" />
                              <span>Owner Admin Panel</span>
                            </Link>
                            <Link
                              href="/admin/employees"
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors",
                                isEmployeesActive
                                  ? "text-neon-blue bg-neon-blue/15 font-semibold"
                                  : "text-gray-300 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <Users className="w-4 h-4 text-neon-blue" />
                              <span>Employees Hub</span>
                            </Link>
                          </>
                        )}

                        <button
                          onClick={() => signOut({ callbackUrl: "/login" })}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Primary Action Button */}
            <Link
              href="/book"
              className="neon-glow-btn px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-neon-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Now</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Navigation Drawer"
              aria-expanded={isMobileMenuOpen}
              className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-gray-200 border border-white/10 hover:border-neon-blue/50 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-neon-blue" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-in Drawer with Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 top-[65px] bg-black/60 backdrop-blur-xs z-30 md:hidden"
            />

            {/* Mobile Drawer */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden glass-panel border-b border-white/10 px-4 pt-3 pb-6 mt-3 space-y-4 shadow-2xl relative z-40 overflow-hidden"
            >
              {/* User Info Bar if Logged In */}
              {session?.user && (
                <div className="p-3 rounded-xl bg-charcoal-850 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Welcome,</p>
                    <p className="text-sm font-semibold text-white">
                      {session.user.name}
                    </p>
                  </div>
                  <CoinBadge coins={userCoins} size="sm" />
                </div>
              )}

              <div className="flex flex-col space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-base font-medium transition-colors",
                      pathname === link.href
                        ? "text-neon-blue bg-neon-blue/10"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                {session?.user && (
                  <>
                    <Link
                      href="/dashboard"
                      className="px-4 py-2.5 rounded-xl text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
                    >
                      My Dashboard & Bookings
                    </Link>

                    {userRole === "admin" && (
                      <>
                        <Link
                          href="/admin"
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-base font-medium transition-colors",
                            isAdminActive
                              ? "text-gold bg-gold/15 font-semibold"
                              : "text-gold hover:bg-gold/10"
                          )}
                        >
                          Owner Admin Panel
                        </Link>
                        <Link
                          href="/admin/employees"
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-base font-medium transition-colors",
                            isEmployeesActive
                              ? "text-neon-blue bg-neon-blue/15 font-semibold"
                              : "text-gray-300 hover:text-white hover:bg-white/5"
                          )}
                        >
                          Employees Hub
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2">
                <Link
                  href="/book"
                  className="w-full neon-glow-btn py-3 rounded-xl text-center font-semibold text-base block shadow-neon-md"
                >
                  Book a Wash
                </Link>

                {session?.user ? (
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full py-2.5 text-center text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="w-full py-2.5 text-center text-sm text-gray-300 hover:text-white block rounded-xl border border-white/10"
                  >
                    Sign In / Register
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
