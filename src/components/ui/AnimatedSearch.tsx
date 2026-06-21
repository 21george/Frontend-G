"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AnimatedSearchProps {
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
  active?: boolean;
}

export function AnimatedSearch({
  children,
  className,
  iconClassName,
  active,
}: AnimatedSearchProps) {
  const [focused, setFocused] = useState(false);
  const isActive = active ?? focused;

  return (
    <div
      className={cn("relative group", className)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
      {/* Animated ring backdrop */}
      <span
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2",
          "flex items-center justify-center",
          "transition-all duration-500 ease-out"
        )}
      >
        <span
          className={cn(
            "absolute inline-flex h-6 w-6 rounded-full",
            "transition-all duration-700 ease-out",
            isActive
              ? "bg-energy-400/20 scale-100 opacity-100"
              : "bg-transparent scale-50 opacity-0"
          )}
        />
        <span
          className={cn(
            "absolute inline-flex h-9 w-9 rounded-full",
            "transition-all duration-700 ease-out delay-75",
            isActive
              ? "bg-energy-400/10 scale-100 opacity-100"
              : "bg-transparent scale-50 opacity-0"
          )}
        />
      </span>

      {/* Search icon with energy stroke animation */}
      <Search
        className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10",
          "transition-all duration-300 ease-out",
          isActive
            ? "text-energy-600 dark:text-energy-400 scale-110"
            : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] scale-100",
          iconClassName
        )}
        strokeWidth={isActive ? 2.5 : 2}
      />

      {children}
    </div>
  );
}
