"use client";

import { scoreBg } from "@/lib/nutrition";

interface ScoreDotsProps {
  score: number;
  max?: number;
  size?: "sm" | "md";
}

export function ScoreDots({ score, max = 10, size = "sm" }: ScoreDotsProps) {
  const col = scoreBg(score);
  const itemCls = size === "sm" ? "h-1.5 w-2.5" : "h-2 w-3";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";
  return (
    <div className={`flex items-center ${gap}`}>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`${itemCls} ${i < score ? col : "bg-slate-200 dark:bg-white/[0.1]"}`}
        />
      ))}
    </div>
  );
}
