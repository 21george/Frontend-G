"use client";

import { useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  Salad,
  Clock,
  Flame,
  Zap,
  Droplets,
  ChevronRight,
  ChevronLeft,
  UtensilsCrossed,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { NutritionPlan, NutritionDay, Meal } from "@/types";
import { formatDate } from "@/lib/utils";

interface Props {
  plan: NutritionPlan;
  expanded: boolean;
  onToggle: () => void;
}

/* ── Helpers ─────────────────────────────────────────────── */

function dayMacros(day: NutritionDay) {
  return day.meals.reduce(
    (acc, meal) => {
      meal.foods.forEach((f) => {
        acc.cal += f.calories ?? 0;
        acc.prot += f.protein_g ?? 0;
        acc.carb += f.carbs_g ?? 0;
        acc.fat += f.fat_g ?? 0;
      });
      return acc;
    },
    { cal: 0, prot: 0, carb: 0, fat: 0 },
  );
}

function mealMacros(meal: Meal) {
  return meal.foods.reduce(
    (acc, f) => {
      acc.cal += f.calories ?? 0;
      acc.prot += f.protein_g ?? 0;
      acc.carb += f.carbs_g ?? 0;
      acc.fat += f.fat_g ?? 0;
      return acc;
    },
    { cal: 0, prot: 0, carb: 0, fat: 0 },
  );
}

/* ── Small macro pill ─────────────────────────────────────── */

function MacroPill({
  icon,
  value,
  unit,
  color,
  bg,
}: {
  icon: React.ReactNode;
  value: number;
  unit: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${bg}`}>
      <span className={color}>{icon}</span>
      <span className={`text-[11px] font-semibold ${color}`}>
        {Math.round(value)}
        <span className="text-[10px] font-normal ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

/* ── Macro progress bar ─────────────────────────────────── */

function MacroBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex-1">
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

/* ── Meal card inside a day ─────────────────────────────── */

function MealCard({ meal, index }: { meal: Meal; index: number }) {
  const macros = mealMacros(meal);
  const mealColors = [
    {
      bg: "bg-orange-50 dark:bg-orange-900/15",
      border: "border-orange-200 dark:border-orange-800/30",
      icon: "text-orange-500",
    },
    {
      bg: "bg-blue-50 dark:bg-blue-900/15",
      border: "border-blue-200 dark:border-blue-800/30",
      icon: "text-blue-500",
    },
    {
      bg: "bg-purple-50 dark:bg-purple-900/15",
      border: "border-purple-200 dark:border-purple-800/30",
      icon: "text-purple-500",
    },
    {
      bg: "bg-indigo-50 dark:bg-indigo-900/15",
      border: "border-indigo-200 dark:border-indigo-800/30",
      icon: "text-indigo-500",
    },
    {
      bg: "bg-emerald-50 dark:bg-emerald-900/15",
      border: "border-emerald-200 dark:border-emerald-800/30",
      icon: "text-emerald-500",
    },
  ];
  const style = mealColors[index % mealColors.length];

  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={13} className={style.icon} />
          <span className="text-[12px] font-semibold text-[var(--text-primary)]">
            {meal.meal_name}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
          <Clock size={10} />
          {meal.time}
        </div>
      </div>

      {/* Foods */}
      <div className="space-y-1.5">
        {meal.foods.map((food, fi) => (
          <div
            key={fi}
            className="flex items-center justify-between gap-2 text-[11px]"
          >
            <span className="text-[var(--text-secondary)] truncate">
              {food.name}{" "}
              <span className="text-[var(--text-tertiary)]">
                · {food.quantity}
              </span>
            </span>
            <span className="flex-shrink-0 flex items-center gap-2 text-[10px]">
              {food.protein_g != null && (
                <span className="text-blue-500 font-medium">
                  P {Math.round(food.protein_g)}g
                </span>
              )}
              {food.carbs_g != null && (
                <span className="text-emerald-500 font-medium">
                  C {Math.round(food.carbs_g)}g
                </span>
              )}
              {food.fat_g != null && (
                <span className="text-amber-500 font-medium">
                  F {Math.round(food.fat_g)}g
                </span>
              )}
              <span className="text-orange-500 font-semibold">
                {Math.round(food.calories ?? 0)} kcal
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Meal macro summary */}
      {meal.foods.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/50 dark:border-white/[0.06] flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-tertiary)]">
            Meal total:
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-orange-500">
              {Math.round(macros.cal)} kcal
            </span>
            <span className="text-[10px] text-blue-500">
              P {Math.round(macros.prot)}g
            </span>
            <span className="text-[10px] text-emerald-500">
              C {Math.round(macros.carb)}g
            </span>
            <span className="text-[10px] text-amber-500">
              F {Math.round(macros.fat)}g
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Day card ─────────────────────────────────────────────── */

function DayCard({ day, index }: { day: NutritionDay; index: number }) {
  const macros = dayMacros(day);
  const maxMacro = Math.max(macros.prot, macros.carb, macros.fat, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="border border-slate-100 dark:border-white/[0.06] rounded-xl overflow-hidden bg-white dark:bg-[#121212]/50"
    >
      {/* Day header */}
      <div className="px-4 py-3 bg-[var(--bg-subtle)] dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.05]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-wide">
              {day.day}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {day.meals.length} meals
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MacroPill
              icon={<Flame size={12} />}
              value={macros.cal}
              unit="kcal"
              color="text-orange-500"
              bg="bg-orange-50 dark:bg-orange-900/20"
            />
          </div>
        </div>

        {/* Macro bars */}
        <div className="flex items-center gap-3 mt-2">
          <MacroBar
            label="Protein"
            value={macros.prot}
            max={maxMacro}
            color="#3b82f6"
          />
          <MacroBar
            label="Carbs"
            value={macros.carb}
            max={maxMacro}
            color="#10b981"
          />
          <MacroBar
            label="Fat"
            value={macros.fat}
            max={maxMacro}
            color="#f59e0b"
          />
        </div>
      </div>

      {/* Meals */}
      <div className="p-3 space-y-2">
        {day.meals.map((meal, mi) => (
          <MealCard key={mi} meal={meal} index={mi} />
        ))}
      </div>
    </motion.div>
  );
}

/* ── Plan macro summary (header) ──────────────────────────── */

function PlanMacroSummary({ plan }: { plan: NutritionPlan }) {
  const {
    calories = 0,
    protein_g = 0,
    carbs_g = 0,
    fat_g = 0,
  } = plan.daily_totals ?? {};

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[var(--bg-subtle)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.05]">
      <MacroPill
        icon={<Flame size={14} />}
        value={calories}
        unit="kcal"
        color="text-orange-500"
        bg="bg-orange-50 dark:bg-orange-900/20"
      />
      <MacroPill
        icon={<Zap size={14} />}
        value={protein_g}
        unit="g P"
        color="text-blue-500"
        bg="bg-blue-50 dark:bg-blue-900/20"
      />
      <MacroPill
        icon={<Salad size={14} />}
        value={carbs_g}
        unit="g C"
        color="text-emerald-500"
        bg="bg-emerald-50 dark:bg-emerald-900/20"
      />
      <MacroPill
        icon={<Droplets size={14} />}
        value={fat_g}
        unit="g F"
        color="text-amber-500"
        bg="bg-amber-50 dark:bg-amber-900/20"
      />
    </div>
  );
}

/* ── Main card ────────────────────────────────────────────── */

export function NutritionListCard({ plan, expanded, onToggle }: Props) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const statusColor =
    {
      active:
        "bg-emerald-100 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400",
      completed:
        "bg-blue-100 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400",
      draft:
        "bg-[var(--bg-subtle)] dark:bg-white/[0.06] text-[var(--text-secondary)] dark:text-slate-400",
    }[plan.status] ?? "bg-[var(--bg-subtle)] text-[var(--text-tertiary)]";

  const days = plan.days ?? [];
  const hasMultipleDays = days.length > 1;
  const safeActiveDayIndex =
    days.length > 0
      ? Math.max(0, Math.min(activeDayIndex, days.length - 1))
      : 0;

  return (
    <div
      className={`border overflow-hidden transition-all ${
        expanded
          ? "border-emerald-300 dark:border-emerald-700/50"
          : "border-[var(--border)] dark:border-white/[0.07]"
      } bg-[var(--bg-card)]`}
    >
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0 rounded-lg">
            <Salad
              size={18}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                {plan.title}
              </p>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusColor}`}
              >
                {plan.status}
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)] mt-0.5">
              Week of {formatDate(plan.week_start, "MMM d, yyyy")} ·{" "}
              {days.length} days ·{" "}
              {days.reduce((s, d) => s + d.meals.length, 0)} meals
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <button
              onClick={onToggle}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-s-xl border border-[var(--border)] dark:border-white/[0.08] bg-[var(--bg-card)] dark:bg-white/[0.03] text-[11px] font-semibold text-[var(--text-secondary)] dark:text-slate-300 hover:bg-[var(--bg-hover)] dark:hover:bg-white/[0.06] transition-colors"
            >
              {expanded ? "Hide Details" : "View Details"}
              <ChevronDown
                size={12}
                className={`transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Macro summary */}
        <PlanMacroSummary plan={plan} />

        {/* Mobile toggle */}
        <button
          onClick={onToggle}
          className="sm:hidden flex items-center justify-center gap-1 px-3 py-1.5 rounded-s-xl border border-[var(--border)] dark:border-white/[0.08] bg-[var(--bg-card)] dark:bg-white/[0.03] text-[11px] font-semibold text-[var(--text-secondary)] dark:text-slate-300"
        >
          {expanded ? "Hide Details" : "View Details"}
          <ChevronDown
            size={12}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* ── Expanded content ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-slate-100 dark:border-white/[0.06]"
          >
            {/* Notes */}
            {plan.notes && (
              <div className="mx-4 sm:mx-5 mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/20">
                <div className="flex items-start gap-2">
                  <StickyNote
                    size={14}
                    className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
                  />
                  <p className="text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed">
                    {plan.notes}
                  </p>
                </div>
              </div>
            )}
            {/* Day navigation (if multiple days) */}
            {hasMultipleDays && (
              <div className="mx-4 sm:mx-5 mt-4">
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {days.map((day, idx) => {
                    const isActive = idx === safeActiveDayIndex;
                    const macros = dayMacros(day);
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveDayIndex(idx)}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg text-left transition-all ${
                          isActive
                            ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30"
                            : "bg-[var(--bg-subtle)] dark:bg-white/[0.02] border border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className={`text-[11px] font-semibold block ${
                            isActive
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {day.day}
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          {Math.round(macros.cal)} kcal
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Day content */}
            <div className="p-4 sm:p-5 space-y-4">
              {hasMultipleDays ? (
                <DayCard day={days[safeActiveDayIndex]} index={0} />
              ) : (
                days.map((day, idx) => (
                  <DayCard key={idx} day={day} index={idx} />
                ))
              )}
            </div>
            Day {safeActiveDayIndex + 1} of {days.length}
            {hasMultipleDays && (
              <div className="px-4 sm:px-5 pb-4 flex items-center justify-between">
                <button
                  onClick={() =>
                    setActiveDayIndex((i) => (i > 0 ? i - 1 : days.length - 1))
                  }
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] dark:hover:bg-white/[0.04] rounded-md transition-colors"
                >
                  <ChevronLeft size={14} /> Previous Day
                </button>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  Day {activeDayIndex + 1} of {days.length}
                </span>
                <button
                  onClick={() =>
                    setActiveDayIndex((i) => (i < days.length - 1 ? i + 1 : 0))
                  }
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] dark:hover:bg-white/[0.04] rounded-md transition-colors"
                >
                  Next Day <ChevronRight size={14} />
                </button>
              </div>
            )}
            {/* Footer actions */}
            <div className="border-t border-slate-100 dark:border-white/[0.06] p-4 sm:px-5 flex items-center justify-between gap-2 bg-[var(--bg-card)]">
              <span className="text-[11px] text-[var(--text-tertiary)]">
                {days.reduce(
                  (s, d) =>
                    s + d.meals.reduce((ms, m) => ms + m.foods.length, 0),
                  0,
                )}{" "}
                total food items
              </span>
              <Link
                href={`/nutrition-plans/${plan.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] rounded-s-xl font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/15 hover:bg-emerald-100 dark:hover:bg-emerald-900/25 transition-colors"
              >
                <ExternalLink size={12} /> Open Full Plan
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
