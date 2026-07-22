"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCreateNutritionPlan, useClients } from "@/lib/hooks";
import FoodSearch from "@/components/foods/FoodSearch";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { DAYS } from "@/lib/utils";
import type { Food, FoodNutrients } from "@/types";

interface PlanFood {
  name: string;
  quantity: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  nutrients_per_100g?: FoodNutrients;
}

const emptyFood = (): PlanFood => ({
  name: "",
  quantity: "",
  quantity_g: 0,
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  nutrients_per_100g: undefined,
});

const emptyMeal = { meal_name: "", time: "08:00", foods: [emptyFood()] };

function parseQuantityToGrams(quantityStr: string): number {
  if (!quantityStr) return 0;
  const match = quantityStr.match(/^\s*(\d+(?:\.\d+)?)\s*(g|kg|ml|l|oz|lb|cup|tbsp|tsp)?\s*$/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = (match[2] ?? "g").toLowerCase();
  switch (unit) {
    case "kg": return val * 1000;
    case "l": return val * 1000;
    case "ml": return val;
    case "oz": return val * 28.35;
    case "lb": return val * 453.6;
    case "cup": return val * 240;
    case "tbsp": return val * 15;
    case "tsp": return val * 5;
    default: return val;
  }
}

function calculateNutrients(nutrientsPer100g: FoodNutrients, quantityG: number): FoodNutrients {
  const factor = quantityG / 100;
  return {
    calories: Math.round(nutrientsPer100g.calories * factor * 10) / 10,
    protein_g: Math.round(nutrientsPer100g.protein_g * factor * 10) / 10,
    carbs_g: Math.round(nutrientsPer100g.carbs_g * factor * 10) / 10,
    fat_g: Math.round(nutrientsPer100g.fat_g * factor * 10) / 10,
  };
}

export default function NewNutritionPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: clientsData } = useClients();
  const clients = clientsData?.data ?? [];
  const createPlan = useCreateNutritionPlan();

  const [clientId, setClientId] = useState(searchParams.get("client") ?? "");
  const [title, setTitle] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(
    DAYS.map((day) => ({
      day,
      meals: [{ ...emptyMeal, foods: [emptyFood()] }],
    })),
  );

  const addMeal = (di: number) =>
    setDays((prev) =>
      prev.map((d, i) =>
        i === di
          ? {
              ...d,
              meals: [...d.meals, { ...emptyMeal, foods: [emptyFood()] }],
            }
          : d,
      ),
    );

  const addFood = (di: number, mi: number) =>
    setDays((prev) =>
      prev.map((d, i) =>
        i === di
          ? {
              ...d,
              meals: d.meals.map((m, j) =>
                j === mi ? { ...m, foods: [...m.foods, emptyFood()] } : m,
              ),
            }
          : d,
      ),
    );

  const updateFood = (
    di: number,
    mi: number,
    fi: number,
    partial: Partial<PlanFood>,
  ) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === di
          ? {
              ...d,
              meals: d.meals.map((m, j) =>
                j === mi
                  ? {
                      ...m,
                      foods: m.foods.map((f, k) => {
                        if (k !== fi) return f;
                        const updated = { ...f, ...partial };
                        // Auto-recalculate if quantity changed and we have nutrients_per_100g
                        if (partial.quantity !== undefined && updated.nutrients_per_100g) {
                          const quantityG = parseQuantityToGrams(updated.quantity);
                          updated.quantity_g = quantityG;
                          if (quantityG > 0) {
                            const calc = calculateNutrients(updated.nutrients_per_100g, quantityG);
                            updated.calories = calc.calories;
                            updated.protein_g = calc.protein_g;
                            updated.carbs_g = calc.carbs_g;
                            updated.fat_g = calc.fat_g;
                          }
                        }
                        return updated;
                      }),
                    }
                  : m,
              ),
            }
          : d,
      ),
    );
  };

  const handleFoodSelect = useCallback(
    (di: number, mi: number, fi: number, food: Food) => {
      setDays((prev) =>
        prev.map((d, i) =>
          i === di
            ? {
                ...d,
                meals: d.meals.map((m, j) =>
                  j === mi
                    ? {
                        ...m,
                        foods: m.foods.map((f, k) => {
                          if (k !== fi) return f;
                          const quantityG = parseQuantityToGrams(f.quantity) || 100;
                          const calc = calculateNutrients(food.nutrients_per_100g, quantityG);
                          return {
                            ...f,
                            name: food.name,
                            nutrients_per_100g: food.nutrients_per_100g,
                            quantity: f.quantity || "100g",
                            quantity_g: quantityG,
                            calories: calc.calories,
                            protein_g: calc.protein_g,
                            carbs_g: calc.carbs_g,
                            fat_g: calc.fat_g,
                          };
                        }),
                      }
                    : m,
                ),
              }
            : d,
        ),
      );
    },
    [],
  );

  const totalMacros = () => {
    let cal = 0,
      pro = 0,
      carb = 0,
      fat = 0;
    days[0].meals.forEach((m) =>
      m.foods.forEach((f) => {
        cal += +f.calories;
        pro += +f.protein_g;
        carb += +f.carbs_g;
        fat += +f.fat_g;
      }),
    );
    return {
      calories: Math.round(cal),
      protein_g: Math.round(pro),
      carbs_g: Math.round(carb),
      fat_g: Math.round(fat),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const replicatedDays = DAYS.map((dayName) => ({
        day: dayName,
        meals: days[0].meals.map((meal) => ({
          ...meal,
          foods: meal.foods.map((food) => ({
            name: food.name,
            quantity: food.quantity,
            quantity_g: food.quantity_g,
            calories: food.calories,
            protein_g: food.protein_g,
            carbs_g: food.carbs_g,
            fat_g: food.fat_g,
            nutrients_per_100g: food.nutrients_per_100g,
            calculated_nutrients: {
              calories: food.calories,
              protein_g: food.protein_g,
              carbs_g: food.carbs_g,
              fat_g: food.fat_g,
            },
          })),
        })),
      }));
      await createPlan.mutateAsync({
        title,
        client_id: clientId,
        week_start: weekStart,
        days: replicatedDays,
        daily_totals: totalMacros(),
      } as any);
      router.push("/nutrition-plans");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <Link
          href="/nutrition-plans"
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] dark:text-[var(--text-secondary)] hover:text-slate-700 dark:hover:text-slate-200 mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] mb-6">
          New Nutrition Plan
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 grid grid-cols-3 gap-4">
            <div>
              <label className="label">Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="Week 1 Nutrition"
                required
              />
            </div>
            <div>
              <label className="label">Client *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="input"
                required
              >
                <option value="">Select client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Week Start *</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          {days.slice(0, 1).map((day, di) => (
            <div key={di} className="card p-4">
              <h3 className="font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] mb-4 capitalize">
                {day.day} (template for all days)
              </h3>
              {day.meals.map((meal, mi) => (
                <div
                  key={mi}
                  className="bg-[var(--bg-page)] dark:bg-[var(--bg-page)] p-3 mb-3"
                >
                  <div className="flex gap-2 mb-2">
                    <input
                      value={meal.meal_name}
                      onChange={(e) =>
                        setDays((prev) =>
                          prev.map((d, i) =>
                            i === di
                              ? {
                                  ...d,
                                  meals: d.meals.map((m, j) =>
                                    j === mi
                                      ? { ...m, meal_name: e.target.value }
                                      : m,
                                  ),
                                }
                              : d,
                          ),
                        )
                      }
                      className="input text-sm w-32"
                      placeholder="Meal"
                    />
                    <input
                      value={meal.time}
                      onChange={(e) =>
                        setDays((prev) =>
                          prev.map((d, i) =>
                            i === di
                              ? {
                                  ...d,
                                  meals: d.meals.map((m, j) =>
                                    j === mi
                                      ? { ...m, time: e.target.value }
                                      : m,
                                  ),
                                }
                              : d,
                          ),
                        )
                      }
                      className="input text-sm w-28"
                      type="time"
                    />
                  </div>
                  <div className="grid grid-cols-7 gap-2 mb-1 px-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide font-semibold col-span-2">
                      Name
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide font-semibold">
                      Qty
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide font-semibold">
                      kcal
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide font-semibold">
                      P (g)
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide font-semibold">
                      C (g)
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wide font-semibold">
                      F (g)
                    </span>
                  </div>
                  {meal.foods.map((food, fi) => (
                    <div key={fi} className="grid grid-cols-7 gap-2 mb-2 items-center">
                      <div className="col-span-2">
                        <FoodSearch
                          value={food.name}
                          onChange={(name) => updateFood(di, mi, fi, { name })}
                          onSelect={(food) => handleFoodSelect(di, mi, fi, food)}
                          placeholder="Search food..."
                        />
                      </div>
                      <input
                        value={food.quantity}
                        onChange={(e) =>
                          updateFood(di, mi, fi, { quantity: e.target.value })
                        }
                        className="input text-sm"
                        placeholder="Qty"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={food.calories}
                        onChange={(e) =>
                          updateFood(di, mi, fi, { calories: +e.target.value })
                        }
                        className="input text-sm"
                        placeholder="kcal"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={food.protein_g}
                        onChange={(e) =>
                          updateFood(di, mi, fi, { protein_g: +e.target.value })
                        }
                        className="input text-sm"
                        placeholder="P(g)"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={food.carbs_g}
                        onChange={(e) =>
                          updateFood(di, mi, fi, { carbs_g: +e.target.value })
                        }
                        className="input text-sm"
                        placeholder="C(g)"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={food.fat_g}
                        onChange={(e) =>
                          updateFood(di, mi, fi, { fat_g: +e.target.value })
                        }
                        className="input text-sm"
                        placeholder="F(g)"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addFood(di, mi)}
                    className="text-xs text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add food
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addMeal(di)}
                className="text-sm text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 flex items-center gap-1 mt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add meal
              </button>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-3 w-59"
          >
            {loading ? "Saving…" : "Save Nutrition Plan"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
