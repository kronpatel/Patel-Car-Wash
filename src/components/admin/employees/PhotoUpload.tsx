"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useState, useRef } from "react";
import { Upload, X, User, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function PhotoUpload({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (url: string) => void;
}) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: max 2MB, image only
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onChange(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="relative w-32 h-32 mx-auto">
        {value ? (
          <>
            <img
              src={value}
              alt="Staff"
              className="w-full h-full object-cover rounded-full border-2 border-neon-blue/50"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full h-full rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center bg-charcoal-900">
            <User className="w-12 h-12 text-gray-500" />
          </div>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 justify-center">
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
            mode === "file" ? "bg-neon-blue text-black font-bold" : "bg-gray-800 text-gray-300 hover:text-white"
          }`}
        >
          <Upload className="w-3 h-3 inline mr-1" />
          Gallery
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
            mode === "url" ? "bg-neon-blue text-black font-bold" : "bg-gray-800 text-gray-300 hover:text-white"
          }`}
        >
          <LinkIcon className="w-3 h-3 inline mr-1" />
          URL
        </button>
      </div>

      {/* Input Area */}
      {mode === "file" ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 text-sm bg-charcoal-850 border border-white/10 rounded-xl hover:border-neon-blue/50 text-gray-200 hover:text-white transition-colors"
          >
            📁 Choose from Gallery / Camera
          </button>
        </>
      ) : (
        <input
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          className="w-full px-3 py-2 text-sm bg-charcoal-850 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/60"
        />
      )}
    </div>
  );
}
