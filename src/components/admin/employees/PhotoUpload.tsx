"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { User, Link as LinkIcon, Check, X, AlertCircle } from "lucide-react";

interface PhotoUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
}

export default function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const [inputUrl, setInputUrl] = useState(value || "");
  const [imageError, setImageError] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setInputUrl(value || "");
    setImageError(false);
    setValidationError(null);
  }, [value]);

  const isValidUrl = (urlString: string): boolean => {
    if (!urlString.trim()) return true;
    try {
      const parsed = new URL(urlString.trim());
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleApply = () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setValidationError(null);
      setImageError(false);
      onChange("");
      return;
    }

    if (!isValidUrl(trimmed)) {
      setValidationError("Please enter a valid HTTP/HTTPS URL (e.g. https://example.com/photo.jpg)");
      return;
    }

    setValidationError(null);
    setImageError(false);
    onChange(trimmed);
  };

  const handleClear = () => {
    setInputUrl("");
    setImageError(false);
    setValidationError(null);
    onChange("");
  };

  const hasValidPhoto = Boolean(value && !imageError && !validationError);

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
        Staff Photo (Optional URL)
      </label>

      <div className="flex items-start gap-4">
        {/* Circular Avatar Preview */}
        <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-white/20 bg-charcoal-900 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group mt-0.5">
          {hasValidPhoto ? (
            <Image
              src={value!}
              alt="Staff Photo"
              fill
              className="object-cover"
              onError={() => {
                setImageError(true);
                setValidationError("Image could not be loaded from this URL.");
              }}
              unoptimized
            />
          ) : (
            <User className="w-8 h-8 text-gray-500" />
          )}

          {hasValidPhoto && (
            <button
              type="button"
              onClick={handleClear}
              title="Remove photo"
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
            >
              <X className="w-5 h-5 text-red-400" />
            </button>
          )}
        </div>

        {/* URL Input Box */}
        <div className="flex-1 space-y-1.5">
          <div className="relative flex items-center">
            <LinkIcon className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (validationError) setValidationError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApply();
                }
              }}
              className="w-full pl-9 pr-16 py-2.5 bg-charcoal-900/90 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/60 focus:ring-1 focus:ring-neon-blue/60 transition-all"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {inputUrl && (
                <>
                  <button
                    type="button"
                    onClick={handleApply}
                    title="Apply photo"
                    className="p-1 rounded-lg bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear input"
                    className="p-1 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {validationError ? (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationError}</span>
            </p>
          ) : (
            <p className="text-[11px] text-gray-500">
              Paste image URL and click checkmark. (File upload coming in Phase 7)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
