"use client";

import { useState, useEffect } from "react";

interface ClientDateProps {
  date: string | Date | number | null;
  options?: Intl.DateTimeFormatOptions;
  fallback?: string;
  className?: string;
}

export function ClientDate({
  date,
  options,
  fallback = "",
  className,
}: ClientDateProps) {
  const [str, setStr] = useState(fallback);

  useEffect(() => {
    if (!date) {
      setStr(fallback);
      return;
    }
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    setStr(d.toLocaleDateString("en-US", options));
  }, [date, fallback, JSON.stringify(options)]);

  return <span className={className}>{str}</span>;
}
