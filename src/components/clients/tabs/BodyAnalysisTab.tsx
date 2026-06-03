"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Ruler,
  Weight,
  User,
  Calendar,
  Dna,
  Droplets,
  Bone,
  Flame,
  Loader2,
} from "lucide-react";
import { useClient, useClientAnalytics } from "@/lib/hooks";

/* ─── Types ────────────────────────────────────────────────────────────── */
interface Props {
  clientId: string;
}

type Gender = "male" | "female";

interface MeasurementPoint {
  key: string;
  label: string;
  unit: string;
  malePos: { top: string; left: string };
  femalePos: { top: string; left: string };
  color: string;
  icon: React.ElementType;
}

/* ─── Measurement pin positions on anatomical figure ───────────────────── */
const MEASUREMENT_POINTS: MeasurementPoint[] = [
  {
    key: "chest_cm",
    label: "Chest",
    unit: "cm",
    malePos: { top: "22%", left: "58%" },
    femalePos: { top: "24%", left: "60%" },
    color: "#00e5ff",
    icon: Activity,
  },
  {
    key: "waist_cm",
    label: "Waist",
    unit: "cm",
    malePos: { top: "36%", left: "56%" },
    femalePos: { top: "38%", left: "58%" },
    color: "#ff9f43",
    icon: Ruler,
  },
  {
    key: "hips_cm",
    label: "Hips",
    unit: "cm",
    malePos: { top: "48%", left: "54%" },
    femalePos: { top: "50%", left: "56%" },
    color: "#ff6b6b",
    icon: Ruler,
  },
  {
    key: "weight_kg",
    label: "Weight",
    unit: "kg",
    malePos: { top: "62%", left: "70%" },
    femalePos: { top: "64%", left: "72%" },
    color: "#a3e635",
    icon: Weight,
  },
];

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function calcBMI(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  return parseFloat((weightKg / (h * h)).toFixed(1));
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "#60a5fa" };
  if (bmi < 25) return { label: "Normal", color: "#34d399" };
  if (bmi < 30) return { label: "Overweight", color: "#fbbf24" };
  return { label: "Obese", color: "#f87171" };
}

function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

function calcAge(dob?: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function sparklinePoints(values: number[], width = 60, height = 20): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function trendSymbol(current: number, previous: number) {
  const delta = current - previous;
  if (Math.abs(delta) < 0.1) return { icon: Minus, color: "#94a3b8", delta: 0 };
  const isUp = delta > 0;
  return {
    icon: isUp ? TrendingUp : TrendingDown,
    color: isUp ? "#34d399" : "#f87171",
    delta: Math.abs(delta),
  };
}

/* ─── Circular gauge ───────────────────────────────────────────────────── */
function Gauge({
  value,
  max,
  size = 84,
  stroke = 8,
  color,
  label,
  sublabel,
  delay = 0,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color: string;
  label: string;
  sublabel?: string;
  delay?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / max));
  const dash = `${c * pct} ${c * (1 - pct)}`;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-slate-100 dark:text-white/[0.06]"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={dash}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.2, delay, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-[15px] font-bold tabular-nums"
            style={{ fontFamily: "JetBrains Mono, monospace", color }}
          >
            {value}
          </span>
          <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">
            {sublabel}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

/* ─── Anatomical pin ───────────────────────────────────────────────────── */
function AnatomicalPin({
  point,
  value,
  prevValue,
  gender,
  delay,
}: {
  point: MeasurementPoint;
  value?: number | null;
  prevValue?: number | null;
  gender: Gender;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);
  const pos = gender === "male" ? point.malePos : point.femalePos;
  const hasValue = value != null;
  const trend =
    hasValue && prevValue != null ? trendSymbol(value, prevValue) : null;

  return (
    <motion.div
      className="absolute z-10"
      style={{ top: pos.top, left: pos.left }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay }}
    >
      <div
        className="relative flex items-center justify-center cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Pulse ring */}
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping"
          style={{ backgroundColor: point.color }}
        />
        {/* Dot */}
        <span
          className="relative inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-white/80 shadow-lg"
          style={{ backgroundColor: point.color }}
        >
          <point.icon size={10} className="text-white" />
        </span>

        {/* Value badge */}
        <AnimatePresence>
          {hovered && hasValue && (
            <motion.div
              initial={{ opacity: 0, x: -8, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -8, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute left-7 top-1/2 -translate-y-1/2 ml-1.5 whitespace-nowrap"
            >
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border shadow-xl backdrop-blur-sm"
                style={{
                  backgroundColor: `${point.color}12`,
                  borderColor: `${point.color}30`,
                }}
              >
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  {point.label}
                </span>
                <span
                  className="text-[13px] font-bold tabular-nums"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: point.color,
                  }}
                >
                  {value}
                  <span className="text-[9px] ml-0.5 opacity-70">
                    {point.unit}
                  </span>
                </span>
                {trend && (
                  <span style={{ color: trend.color }}>
                    <trend.icon size={12} />
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Measurement row ──────────────────────────────────────────────────── */
function MeasurementRow({
  label,
  current,
  previous,
  unit,
  sparklineValues,
  delay,
}: {
  label: string;
  current: number | null;
  previous: number | null;
  unit: string;
  sparklineValues: number[];
  delay: number;
}) {
  const trend =
    current != null && previous != null ? trendSymbol(current, previous) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center justify-between py-2.5 px-3 border-b border-[var(--border)] dark:border-white/[0.04] last:border-0 hover:bg-[var(--bg-subtle)] dark:hover:bg-white/[0.02] transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[11px] font-medium text-[var(--text-secondary)] w-16 truncate">
          {label}
        </span>
        {sparklineValues.length > 1 && (
          <svg width={48} height={16} className="hidden sm:block flex-shrink-0">
            <polyline
              fill="none"
              stroke="var(--energy)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.5}
              points={sparklinePoints(sparklineValues, 48, 16)}
            />
          </svg>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {previous != null && (
          <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums hidden sm:inline">
            {previous}
            {unit}
          </span>
        )}
        {trend && (
          <span style={{ color: trend.color }}>
            <trend.icon size={12} />
          </span>
        )}
        <span
          className="text-[13px] font-bold tabular-nums text-[var(--text-primary)] w-16 text-right"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          {current != null ? `${current}${unit}` : "—"}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────── */
export function BodyAnalysisTab({ clientId }: Props) {
  const { data: clientData, isLoading: clientLoading } = useClient(clientId);
  const { data: analyticsData, isLoading: analyticsLoading } =
    useClientAnalytics(clientId);

  const client = clientData;
  const analytics = analyticsData;

  // Derive gender strictly from client's profile; default to male only if unknown
  const gender: Gender = client?.gender === "female" ? "female" : "male";

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image state when gender changes (e.g., if client data updates)
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [gender]);

  const measurements = useMemo(() => {
    const sorted = [...(analytics?.measurements ?? [])].sort(
      (a, b) =>
        new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime(),
    );
    return sorted;
  }, [analytics?.measurements]);

  const latest = measurements[0];
  const previous = measurements[1];

  const weight = latest?.weight_kg ?? client?.current_weight_kg ?? null;
  const height = client?.height_cm ?? null;
  const age = calcAge(client?.date_of_birth);
  const bmi = weight != null && height != null ? calcBMI(weight, height) : null;
  const bmr =
    weight != null && height != null && age != null
      ? calcBMR(weight, height, age, gender)
      : null;

  const bodyFat = latest?.body_fat_pct ?? null;
  const fatMass =
    bodyFat != null && weight != null
      ? parseFloat(((bodyFat / 100) * weight).toFixed(1))
      : null;
  const leanMass =
    fatMass != null && weight != null
      ? parseFloat((weight - fatMass).toFixed(1))
      : null;

  // Sparkline data per measurement key
  const sparklines = useMemo(() => {
    const map: Record<string, number[]> = {};
    const keys = [
      "weight_kg",
      "chest_cm",
      "waist_cm",
      "hips_cm",
      "body_fat_pct",
    ];
    keys.forEach((k) => {
      map[k] = measurements
        .slice()
        .reverse()
        .map((m) => (m as any)[k])
        .filter((v) => v != null);
    });
    return map;
  }, [measurements]);

  const compositionGauges = [
    {
      value: bodyFat ?? 0,
      max: 40,
      color: "#ff9f43",
      label: "Body Fat",
      sublabel: "%",
    },
    {
      value: leanMass ?? 0,
      max: weight ? weight * 0.9 : 80,
      color: "#34d399",
      label: "Lean Mass",
      sublabel: "kg",
    },
    {
      value: bmi ?? 0,
      max: 40,
      color: bmi ? bmiCategory(bmi).color : "#94a3b8",
      label: "BMI",
      sublabel: bmi ? bmiCategory(bmi).label : "—",
    },
  ];

  const hasAnyData =
    latest != null || weight != null || height != null || bodyFat != null;

  if (clientLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-8 text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Client data not available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header bar ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center rounded-md bg-[var(--energy)]/10">
            <Dna size={16} className="text-[var(--energy)]" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
              Body Composition & Measurements
            </h3>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
              {client.name} · {gender === "male" ? "Male" : "Female"} Anatomy
            </p>
          </div>
        </div>

        {/* Gender badge — read-only, synced to client profile */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border"
            style={{
              backgroundColor:
                gender === "male"
                  ? "rgba(59,130,246,0.10)"
                  : "rgba(236,72,153,0.10)",
              borderColor:
                gender === "male"
                  ? "rgba(59,130,246,0.30)"
                  : "rgba(236,72,153,0.30)",
              color: gender === "male" ? "#3b82f6" : "#ec4899",
            }}
          >
            <User size={10} />
            {gender === "male" ? "Male Profile" : "Female Profile"}
          </span>
        </div>
      </motion.div>

      {!hasAnyData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-8 text-center space-y-3"
        >
          <Activity
            size={28}
            className="mx-auto text-slate-300 dark:text-slate-700"
          />
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">
            No body measurements recorded yet
          </p>
          <p className="text-[12px] text-[var(--text-tertiary)] max-w-sm mx-auto">
            Once measurements are logged, this panel will visualize body
            composition trends, anatomical mapping, and health indicators.
          </p>
        </motion.div>
      )}

      {hasAnyData && (
        <>
          {/* ── Main visualization row ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Anatomical figure */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-5 relative overflow-hidden min-h-[420px] flex items-center justify-center"
            >
              {/* Medical grid overlay */}
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Scan line */}
              <motion.div
                className="absolute left-0 right-0 h-[1px] bg-[var(--energy)]/30 pointer-events-none z-0"
                initial={{ top: "0%" }}
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Anatomical image */}
              <div className="relative h-full w-full flex items-center justify-center p-6 bg-[var(--bg-card)]">
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center z-0">
                    <Loader2
                      size={20}
                      className="animate-spin text-slate-300"
                    />
                  </div>
                )}
                <img
                  src={`/img/anatomy-${gender}.png`}
                  alt={`${gender} anatomical view`}
                  className={`max-h-[480px] w-auto object-contain transition-opacity duration-500 z-[1] ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
                {imageError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-0 text-center p-6">
                    <div className="w-32 h-48 rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center mb-3">
                      <User size={32} className="text-[var(--text-tertiary)]" />
                    </div>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      Add{" "}
                      <code className="text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-1 rounded">
                        /img/anatomy-{gender}.png
                      </code>{" "}
                      to display the anatomical figure
                    </p>
                  </div>
                )}

                {/* Floating measurement pins */}
                {MEASUREMENT_POINTS.map((point, i) => (
                  <AnatomicalPin
                    key={point.key}
                    point={point}
                    value={(latest as any)?.[point.key]}
                    prevValue={(previous as any)?.[point.key]}
                    gender={gender}
                    delay={0.3 + i * 0.1}
                  />
                ))}
              </div>

              {/* Bottom label */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-[var(--bg-card)] to-transparent">
                <p className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-widest text-center">
                  Anterior View · Muscular System
                </p>
              </div>
            </motion.div>

            {/* Right: Composition + Metrics */}
            <div className="lg:col-span-7 space-y-4">
              {/* Body composition gauges */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Body Composition
                  </p>
                  {latest?.date && (
                    <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(latest.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-around">
                  {compositionGauges.map((g, i) => (
                    <Gauge key={g.label} {...g} delay={0.3 + i * 0.15} />
                  ))}
                </div>
              </motion.div>

              {/* Key stats grid */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {[
                  {
                    label: "Weight",
                    value: weight,
                    unit: "kg",
                    icon: Weight,
                    color: "#a3e635",
                  },
                  {
                    label: "Height",
                    value: height,
                    unit: "cm",
                    icon: Ruler,
                    color: "#60a5fa",
                  },
                  {
                    label: "Age",
                    value: age,
                    unit: "y",
                    icon: User,
                    color: "#f472b6",
                  },
                  {
                    label: "BMR",
                    value: bmr,
                    unit: "kcal",
                    icon: Flame,
                    color: "#fbbf24",
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex items-center gap-2.5 p-3 border border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-card)]"
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-md"
                      style={{ background: `${stat.color}1a` }}
                    >
                      <stat.icon size={16} style={{ color: stat.color }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p
                        className="text-[14px] font-bold text-[var(--text-primary)] tabular-nums"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}
                      >
                        {stat.value != null ? stat.value : "—"}
                        {stat.value != null && (
                          <span className="text-[10px] font-normal text-[var(--text-tertiary)] ml-0.5">
                            {stat.unit}
                          </span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Water / Bone / Fat breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-4"
              >
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Mass Breakdown
                </p>
                <div className="space-y-3">
                  {[
                    {
                      label: "Fat Mass",
                      value: fatMass,
                      total: weight,
                      color: "#ff9f43",
                      icon: Droplets,
                    },
                    {
                      label: "Lean Mass",
                      value: leanMass,
                      total: weight,
                      color: "#34d399",
                      icon: Dna,
                    },
                    {
                      label: "Bone Est.",
                      value:
                        weight != null
                          ? parseFloat((weight * 0.04).toFixed(1))
                          : null,
                      total: weight,
                      color: "#94a3b8",
                      icon: Bone,
                    },
                  ].map((row) => {
                    const pct =
                      row.value != null && row.total
                        ? Math.round((row.value / row.total) * 100)
                        : 0;
                    return (
                      <div key={row.label} className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 flex items-center justify-center rounded-md flex-shrink-0"
                          style={{ background: `${row.color}1a` }}
                        >
                          <row.icon size={14} style={{ color: row.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                              {row.label}
                            </span>
                            <span
                              className="text-[11px] font-bold tabular-nums"
                              style={{
                                fontFamily: "JetBrains Mono, monospace",
                                color: row.color,
                              }}
                            >
                              {row.value != null ? `${row.value} kg` : "—"}
                              <span className="text-[9px] text-[var(--text-tertiary)] ml-1">
                                {pct > 0 ? `${pct}%` : ""}
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: row.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>

          {/* ── Measurements table ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] dark:border-white/[0.06]">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Measurement History
              </p>
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {measurements.length} record
                {measurements.length !== 1 ? "s" : ""}
              </span>
            </div>

            {measurements.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-[var(--text-tertiary)]">
                No measurement records found.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)] dark:divide-white/[0.04]">
                {measurements.slice(0, 8).map((m, i) => {
                  const prev = measurements[i + 1];
                  return (
                    <div key={m.date ?? i} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar
                          size={10}
                          className="text-[var(--text-tertiary)]"
                        />
                        <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                          {m.date
                            ? new Date(m.date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Unknown date"}
                        </span>
                        {i === 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--energy)]/10 text-[var(--energy)] uppercase tracking-wider">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { key: "weight_kg", label: "Weight", unit: "kg" },
                          { key: "chest_cm", label: "Chest", unit: "cm" },
                          { key: "waist_cm", label: "Waist", unit: "cm" },
                          { key: "hips_cm", label: "Hips", unit: "cm" },
                          { key: "body_fat_pct", label: "Body Fat", unit: "%" },
                        ].map((col) => {
                          const val = (m as any)[col.key];
                          const pval = prev ? (prev as any)[col.key] : null;
                          const t =
                            val != null && pval != null
                              ? trendSymbol(val, pval)
                              : null;
                          return (
                            <div
                              key={col.key}
                              className="flex items-center justify-between p-2 rounded bg-[var(--bg-subtle)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.04]"
                            >
                              <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">
                                {col.label}
                              </span>
                              <div className="flex items-center gap-1">
                                {t && (
                                  <span style={{ color: t.color }}>
                                    <t.icon size={10} />
                                  </span>
                                )}
                                <span
                                  className="text-[12px] font-bold tabular-nums text-[var(--text-primary)]"
                                  style={{
                                    fontFamily: "JetBrains Mono, monospace",
                                  }}
                                >
                                  {val != null ? `${val}${col.unit}` : "—"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {measurements.length > 8 && (
              <div className="px-4 py-2 border-t border-[var(--border)] dark:border-white/[0.06] text-center">
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  +{measurements.length - 8} older records
                </span>
              </div>
            )}
          </motion.div>

          {/* ── Current snapshot (summary cards) ───────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="border border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-card)] p-4"
          >
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Latest Snapshot
            </p>
            <div className="space-y-1">
              <MeasurementRow
                label="Weight"
                current={latest?.weight_kg ?? null}
                previous={previous?.weight_kg ?? null}
                unit="kg"
                sparklineValues={sparklines.weight_kg}
                delay={0.65}
              />
              <MeasurementRow
                label="Chest"
                current={latest?.chest_cm ?? null}
                previous={previous?.chest_cm ?? null}
                unit="cm"
                sparklineValues={sparklines.chest_cm}
                delay={0.7}
              />
              <MeasurementRow
                label="Waist"
                current={latest?.waist_cm ?? null}
                previous={previous?.waist_cm ?? null}
                unit="cm"
                sparklineValues={sparklines.waist_cm}
                delay={0.75}
              />
              <MeasurementRow
                label="Hips"
                current={latest?.hips_cm ?? null}
                previous={previous?.hips_cm ?? null}
                unit="cm"
                sparklineValues={sparklines.hips_cm}
                delay={0.8}
              />
              <MeasurementRow
                label="Body Fat"
                current={latest?.body_fat_pct ?? null}
                previous={previous?.body_fat_pct ?? null}
                unit="%"
                sparklineValues={sparklines.body_fat_pct}
                delay={0.85}
              />
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
