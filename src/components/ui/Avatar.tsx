"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Single shared avatar used for both coaches and clients. Consolidates what
// used to be two near-identical implementations (ClientAvatar + an inline
// CoachAvatar in DashboardHeader) that had drifted apart — notably the coach
// version was missing broken-image fallback handling entirely.

const COLOR_PALETTE = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#4f46e5",
  "#c026d3",
];

function getInitials(name?: string | null, surname?: string | null): string {
  if (name && surname) return `${name[0]}${surname[0]}`.toUpperCase();
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function colorFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

export interface AvatarProps {
  /** First/given name (or full name if `surname` is omitted) */
  name?: string | null;
  surname?: string | null;
  /** Profile photo URL; falls back to initials on load error or when absent */
  photo?: string | null;
  /** Pre-computed initials, overrides name/surname-derived initials */
  initials?: string;
  /** Tailwind size classes, e.g. "h-11 w-11" (default) */
  size?: string;
  /** 'brand' = solid brand-600 background (default, used for clients);
   *  'colored' = deterministic per-name hashed background (used for coaches) */
  variant?: "brand" | "colored";
  shape?: "circle" | "squircle";
  className?: string;
}

export function Avatar({
  name,
  surname,
  photo,
  initials,
  size = "h-11 w-11",
  variant = "brand",
  shape = "circle",
  className = "",
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Reset error state when the photo URL changes so a refreshed image (e.g.
  // after the presigned URL is re-issued) gets a chance to load again.
  useEffect(() => setImgError(false), [photo]);

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-10";
  const label = initials ?? getInitials(name, surname);
  const displayName = surname
    ? `${name ?? ""} ${surname}`.trim()
    : (name ?? "User");

  if (photo && !imgError) {
    return (
      <div
        className={`relative ${size} ${shapeClass} overflow-hidden shrink-0 ${className}`}
      >
        <Image
          src={photo}
          alt={displayName}
          fill
          className="object-cover"
          unoptimized
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={displayName}
      style={
        variant === "colored"
          ? { backgroundColor: colorFromSeed(displayName) }
          : undefined
      }
      className={`flex ${size} ${shapeClass} items-center justify-center shrink-0 font-bold text-white select-none ${
        variant === "brand"
          ? "bg-brand-600 dark:bg-brand-500 text-sm"
          : "text-[13px]"
      } ${className}`}
    >
      {label}
    </div>
  );
}
