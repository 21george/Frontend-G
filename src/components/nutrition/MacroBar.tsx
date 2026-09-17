"use client";

import { motion } from "framer-motion";

interface MacroBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  className?: string;
}

export function MacroBar({ label, value, max, color, className = "" }: MacroBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`flex-1 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium text-[var(--text-tertiary)]">
          {label}
        </span>
        <span className="text-[10px] font-semibold" style={{ color }}>
          {Math.round(value)}g
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
