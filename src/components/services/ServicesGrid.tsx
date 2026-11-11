"use client";

import React, { useState } from "react";
import { Search, Sparkles, Droplets, Bike, Layers } from "lucide-react";
import { SERVICES } from "@/lib/constants";
import ServiceCard from "./ServiceCard";
import { ServiceCategory } from "@/types";

type FilterTab = "all" | ServiceCategory;

interface TabConfig {
  id: FilterTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: "all", label: "All Treatments", icon: Layers },
  { id: "wash", label: "Express Car Wash", icon: Droplets },
  { id: "detailing", label: "Luxury Detailing", icon: Sparkles },
  { id: "bike", label: "Bike & Superbike", icon: Bike },
];

export default function ServicesGrid() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = SERVICES.filter((service) => {
    const matchesTab = activeTab === "all" || service.category === activeTab;
    const matchesSearch =
      searchQuery.trim() === "" ||
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-10">
      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl glass-panel border border-white/10 w-full md:w-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count =
              tab.id === "all"
                ? SERVICES.length
                : SERVICES.filter((s) => s.category === tab.id).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-neon-blue text-charcoal-950 shadow-neon-sm scale-102"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? "bg-charcoal-950/20 text-charcoal-950"
                      : "bg-charcoal-800 text-gray-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Keyword Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search treatments..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm placeholder:text-gray-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center max-w-md mx-auto border border-white/5">
          <Sparkles className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-heading font-bold text-white mb-1">
            No Treatments Found
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            No treatments matched &ldquo;{searchQuery}&rdquo;. Try another
            keyword or reset the filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveTab("all");
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-charcoal-800 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue hover:text-charcoal-950 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
