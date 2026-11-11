"use client";

import React from "react";
import { Coins, ArrowDownLeft, ArrowUpRight, Clock, Sparkles } from "lucide-react";
import { ICoinTransaction } from "@/types";
import { formatINR } from "@/lib/utils";
import { LOYALTY_RULES } from "@/lib/constants";

interface CoinHistoryProps {
  transactions: ICoinTransaction[];
}

export default function CoinHistory({ transactions }: CoinHistoryProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="glass-panel p-10 rounded-3xl text-center border border-white/5 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center mx-auto">
          <Coins className="w-6 h-6" />
        </div>
        <h4 className="text-base font-heading font-bold text-white">
          No Coin Transactions Yet
        </h4>
        <p className="text-xs text-gray-400 max-w-sm mx-auto">
          You earn 10 Clean Coins for every ₹100 spent on washes. Book your first
          wash to start building your rewards!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-xl">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
            Transaction Activity Log
          </h3>
        </div>
        <span className="text-xs text-gray-400">
          Showing latest {transactions.length} records
        </span>
      </div>

      <div className="divide-y divide-white/5">
        {transactions.map((tx) => {
          const isEarned = tx.type === "earned";
          const rupeeWorth = Math.floor(
            tx.amount * LOYALTY_RULES.COIN_REDEMPTION_VALUE
          );
          const dateStr = new Date(tx.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={tx._id}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isEarned
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-gold/10 text-gold border-gold/30"
                  }`}
                >
                  {isEarned ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    {tx.reason}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{dateStr}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`text-base font-heading font-black tracking-tight ${
                    isEarned ? "text-emerald-400" : "text-gold"
                  }`}
                >
                  {isEarned ? "+" : "-"}
                  {tx.amount.toLocaleString("en-IN")}{" "}
                  <span className="text-xs font-normal">Coins</span>
                </p>
                <p className="text-[11px] text-gray-400 font-mono">
                  ({isEarned ? "+" : "-"}
                  {formatINR(rupeeWorth)})
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
