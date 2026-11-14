"use client";

import React, { useState } from "react";
import {
  QrCode,
  Download,
  Printer,
  Ban,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Clock,
  AlertTriangle,
  AlertCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/validators";

export interface QRData {
  id: string;
  token: string;
  qrImage: string;
  scanURL: string;
  expiresAt: string;
  expiresIn: number;
  createdAt: string;
  daysRemaining: number;
}

interface QRCardProps {
  qr: QRData | null;
  onGenerate: () => void;
  onDeactivate: (id: string) => void;
  onRefresh: () => void;
}

function downloadQR(dataURL: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printQR(qr: QRData) {
  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Popup blocked! Please allow popups to print.");
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Patel Car'spa - Attendance QR</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 40px; color: #111; }
          .card { border: 2px solid #000; border-radius: 16px; max-width: 480px; margin: 0 auto; padding: 30px; }
          h1 { font-size: 24px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
          p { margin: 6px 0; }
          .qr { margin: 24px auto; }
          .qr img { width: 360px; height: 360px; }
          .info { margin-top: 20px; font-size: 13px; color: #444; line-height: 1.6; }
          .badge { display: inline-block; background: #000; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-top: 10px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Patel Car'spa & Detailing Studio</h1>
          <p style="color: #666; font-size: 14px;">Staff Attendance Punch QR Code</p>
          <div class="qr">
            <img src="${qr.qrImage}" alt="Attendance QR" />
          </div>
          <div class="info">
            <p><strong>Scan with staff mobile to mark attendance</strong></p>
            <p>Requires GPS verification within 100 meters of shop</p>
            <div class="badge">VALID FOR ${qr.expiresIn} DAYS</div>
            <p style="margin-top: 10px; font-size: 12px; color: #777;">
              Valid until: ${new Date(qr.expiresAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

export default function QRCard({
  qr,
  onGenerate,
  onDeactivate,
  onRefresh,
}: QRCardProps) {
  const [copied, setCopied] = useState<boolean>(false);

  // ─── 1. Empty State (qr === null) ───
  if (!qr) {
    return (
      <div className="p-8 rounded-2xl bg-charcoal-850 border border-white/10 text-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 text-neon-blue flex items-center justify-center mx-auto mb-4 shadow-neon-sm">
          <QrCode className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-1.5 font-heading">
          No Active Attendance QR
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
          No active QR. Generate one to start attendance tracking for your studio employees.
        </p>
        <button
          type="button"
          onClick={onGenerate}
          className="px-5 py-2.5 rounded-xl bg-neon-blue text-black font-bold text-sm hover:bg-neon-hover transition-all shadow-neon-sm inline-flex items-center gap-2 active:scale-98"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Generate New QR
        </button>
      </div>
    );
  }

  // Banner conditions
  const isExpired = qr.daysRemaining <= 0;
  const isExpiringSoon = qr.daysRemaining > 0 && qr.daysRemaining <= 7;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qr.scanURL);
      setCopied(true);
      toast.success("Scan URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleDownload = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    downloadQR(qr.qrImage, `patel-attendance-qr-${dateStr}.png`);
    toast.success("Attendance QR downloaded as PNG!");
  };

  const handlePrint = () => {
    printQR(qr);
  };

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-charcoal-850 border border-white/10 shadow-2xl relative overflow-hidden space-y-5">
      {/* Background ambient neon glow */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-neon-blue/10 rounded-full blur-3xl pointer-events-none" />

      {/* Expiry Alert Banners */}
      {isExpired && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-between gap-3 text-red-300 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="font-semibold">
              🔴 QR EXPIRED. Generate a new one to enable attendance scanning.
            </span>
          </div>
          <button
            onClick={onGenerate}
            className="px-3 py-1 rounded-lg bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-colors"
          >
            Generate Now
          </button>
        </div>
      )}

      {isExpiringSoon && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-300 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="font-semibold">
              ⚠️ QR will expire soon ({qr.daysRemaining} {qr.daysRemaining === 1 ? "day" : "days"} left).
            </span>
          </div>
          <button
            onClick={onGenerate}
            className="px-3 py-1 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
          >
            Renew QR
          </button>
        </div>
      )}

      {/* Main Card Content */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 relative z-10">
        {/* Left: QR Image Preview */}
        <div className="relative group shrink-0">
          <div className="w-64 h-64 p-3 bg-charcoal-900 border-2 border-neon-blue/40 rounded-2xl shadow-neon-md flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr.qrImage}
              alt="Active Attendance QR"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 text-gray-300 border border-white/10">
            400x400 PNG
          </div>
        </div>

        {/* Right: Info Panel & Actions */}
        <div className="flex-1 w-full space-y-5">
          {/* Top Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isExpired
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isExpired ? "bg-red-400" : "bg-emerald-400 animate-pulse"
                  }`}
                />
                {isExpired ? "EXPIRED" : "ACTIVE"}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                Token: {qr.token.slice(0, 10)}...
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Remaining</span>
                <span
                  className={`text-lg font-extrabold font-mono ${
                    isExpired
                      ? "text-red-400"
                      : isExpiringSoon
                      ? "text-amber-400"
                      : "text-neon-blue"
                  }`}
                >
                  {isExpired ? "0 Days" : `${qr.daysRemaining} Days`}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-charcoal-900/80 border border-white/5">
              <div className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-neon-blue" />
                Created
              </div>
              <div className="text-sm font-semibold text-gray-200">
                {formatDate(qr.createdAt)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-charcoal-900/80 border border-white/5">
              <div className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-gold" />
                Expires
              </div>
              <div className="text-sm font-semibold text-gray-200">
                {formatDate(qr.expiresAt)}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                ({qr.expiresIn} days validity)
              </div>
            </div>

            <div className="p-3 rounded-xl bg-charcoal-900/80 border border-white/5">
              <div className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                Punch Radius
              </div>
              <div className="text-sm font-semibold text-emerald-400">
                100m Geofence
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Patel Studio Rankuva
              </div>
            </div>
          </div>

          {/* Scan URL copy bar */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">
              Scan URL Endpoint
            </label>
            <div className="flex items-center gap-2 p-2 pl-3 rounded-xl bg-charcoal-900 border border-white/10">
              <span className="text-xs text-gray-300 font-mono truncate flex-1 select-all">
                {qr.scanURL}
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <a
                href={qr.scanURL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-neon-blue transition-colors"
                title="Open scan page in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-white/10 text-white font-semibold text-sm transition-all flex items-center gap-2 active:scale-98"
            >
              <Download className="w-4 h-4 text-neon-blue" />
              Download PNG
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-white/10 text-white font-semibold text-sm transition-all flex items-center gap-2 active:scale-98"
            >
              <Printer className="w-4 h-4 text-gold" />
              Print Code
            </button>
            <button
              type="button"
              onClick={() => onDeactivate(qr.id)}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-sm transition-all flex items-center gap-2 ml-auto active:scale-98"
            >
              <Ban className="w-4 h-4" />
              Deactivate QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
