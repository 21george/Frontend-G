"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import FoodSearch from "@/components/foods/FoodSearch";
import { useCalculateNutrition, useGetFoodDetails } from "@/lib/hooks";
import { useState } from "react";
import {
  Search,
  Flame,
  Zap,
  Salad,
  Droplets,
  Scale,
  RotateCcw,
  Loader2,
} from "lucide-react";
import type { Food } from "@/types";

function MacroCard({
  icon,
  label,
  value,
  unit,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
      <div className={`p-2.5 rounded-lg ${color} bg-white/60 dark:bg-black/20`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
          {value}
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">
            {unit}
          </span>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function NutritionCalculatorPage() {
  const [foodName, setFoodName] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("");

  const { data: result, isFetching: isCalculating } = useCalculateNutrition(
    selectedFood,
    quantity,
  );

  // Fetch full USDA details for the selected food to get accurate per-100g data
  const { data: foodDetails } = useGetFoodDetails(selectedFood?.fdc_id);
  const per100g =
    foodDetails?.nutrients_per_100g ?? selectedFood?.nutrients_per_100g;

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food);
    setFoodName(food.name);
  };

  const handleReset = () => {
    setFoodName("");
    setSelectedFood(null);
    setQuantity("");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 mb-4">
            <Scale className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] mb-2">
            Nutrition Calculator
          </h1>
          <p className="text-sm text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
            Search a food by name, enter the quantity, and see the full
            nutritional breakdown.
          </p>
        </div>

        <div className="card p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              Food Name
            </label>
            <FoodSearch
              value={foodName}
              onChange={setFoodName}
              onSelect={handleFoodSelect}
              placeholder="e.g. Chicken breast, rice, avocado..."
            />
            {selectedFood && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                  {selectedFood.source}
                </span>
                <span>
                  {per100g?.calories ??
                    selectedFood.nutrients_per_100g.calories}{" "}
                  kcal per 100g
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              Quantity
            </label>
            <div className="relative">
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 150g, 2 cups, 1lb"
                className="w-full pl-4 pr-12 py-2.5 text-sm bg-white dark:bg-[#121212] border border-[var(--border)] dark:border-white/[0.07] rounded-lg text-[var(--text-primary)] dark:text-[var(--text-primary)] placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none focus:border-green-400 dark:focus:border-green-500/60 transition-colors"
              />
              {isCalculating ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
              ) : (
                <Scale className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-500">
              Supported units: g, kg, ml, l, oz, lb, cup, tbsp, tsp
            </p>
          </div>

          {result && selectedFood && (
            <>
              <div className="border-t border-slate-200 dark:border-white/[0.06] pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                    Results for{" "}
                    <span className="text-green-600 dark:text-green-400">
                      {selectedFood.name}
                    </span>{" "}
                    × {quantity.trim()}
                  </h3>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MacroCard
                    icon={<Flame className="w-5 h-5 text-orange-500" />}
                    label="Calories"
                    value={result.calories}
                    unit="kcal"
                    color="text-orange-500"
                    bg="bg-orange-50 dark:bg-orange-900/20"
                  />
                  <MacroCard
                    icon={<Salad className="w-5 h-5 text-green-600" />}
                    label="Protein"
                    value={result.protein_g}
                    unit="g"
                    color="text-green-600"
                    bg="bg-green-50 dark:bg-green-900/20"
                  />
                  <MacroCard
                    icon={<Zap className="w-5 h-5 text-amber-500" />}
                    label="Carbohydrates"
                    value={result.carbs_g}
                    unit="g"
                    color="text-amber-500"
                    bg="bg-amber-50 dark:bg-amber-900/20"
                  />
                  <MacroCard
                    icon={<Droplets className="w-5 h-5 text-slate-500" />}
                    label="Fat"
                    value={result.fat_g}
                    unit="g"
                    color="text-slate-500"
                    bg="bg-slate-100 dark:bg-slate-800/60"
                  />
                </div>

                <div className="mt-4 p-4 bg-[var(--bg-page)] dark:bg-[var(--bg-page)] rounded-lg border border-[var(--border)] dark:border-white/[0.06]">
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                    Per 100g Reference
                  </h4>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {[
                      {
                        label: "Calories",
                        value: per100g?.calories ?? 0,
                        unit: "kcal",
                      },
                      {
                        label: "Protein",
                        value: per100g?.protein_g ?? 0,
                        unit: "g",
                      },
                      {
                        label: "Carbs",
                        value: per100g?.carbs_g ?? 0,
                        unit: "g",
                      },
                      {
                        label: "Fat",
                        value: per100g?.fat_g ?? 0,
                        unit: "g",
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                          {item.value}
                          <span className="text-[10px] font-normal text-slate-500 ml-0.5">
                            {item.unit}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {!result && selectedFood && !quantity && (
            <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
              <Scale className="w-5 h-5 mx-auto mb-2 opacity-50" />
              Enter a quantity above to see the nutrition breakdown.
            </div>
          )}

          {!selectedFood && (
            <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
              <Search className="w-5 h-5 mx-auto mb-2 opacity-50" />
              Search for a food above to get started.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
