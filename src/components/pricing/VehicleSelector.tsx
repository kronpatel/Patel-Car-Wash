"use client";

import React from "react";
import { Car, Bike, Truck, Bus } from "lucide-react";
import { VehicleType } from "@/types";
import { VEHICLE_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface VehicleSelectorProps {
  selected: VehicleType;
  onChange: (vehicle: VehicleType) => void;
  className?: string;
}

export default function VehicleSelector({
  selected,
  onChange,
  className,
}: VehicleSelectorProps) {
  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case "Small Sedan":
        return <Car className="w-4 h-4" />;
      case "SUV":
        return <Car className="w-5 h-5" />;
      case "Pickup":
        return <Truck className="w-4 h-4" />;
      case "Minibus":
        return <Bus className="w-4 h-4" />;
      case "Bike":
        return <Bike className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl glass-panel max-w-2xl mx-auto border border-white/10",
        className
      )}
    >
      {VEHICLE_TYPES.map((vehicle) => {
        const isSelected = selected === vehicle;
        return (
          <button
            key={vehicle}
            type="button"
            onClick={() => onChange(vehicle)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200",
              isSelected
                ? "bg-neon-blue text-charcoal-950 shadow-neon-sm scale-105"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            )}
          >
            {getVehicleIcon(vehicle)}
            <span>{vehicle}</span>
          </button>
        );
      })}
    </div>
  );
}
