import type { FoodNutrients, Meal, NutritionDay, NutritionPlan } from "@/types";

export interface EmptyFood extends FoodNutrients {
  name: string;
  quantity: string;
  quantity_g: number;
  nutrients_per_100g?: FoodNutrients;
}

export const emptyFood = (): EmptyFood => ({
  name: "",
  quantity: "",
  quantity_g: 0,
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  nutrients_per_100g: undefined,
});

export const emptyMeal = (): Meal => ({
  meal_name: "Meal",
  time: "08:00",
  foods: [emptyFood()],
});

// Parses a plain, fractional ("1/2"), or mixed-number ("1 1/2") quantity into a float.
function parseQuantityValue(raw: string): number {
  const mixed = raw.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const denominator = parseInt(mixed[3], 10);
    if (denominator === 0) {
      throw new Error(`Unrecognized quantity: "${raw}"`);
    }
    return parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / denominator;
  }
  const fraction = raw.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const denominator = parseInt(fraction[2], 10);
    if (denominator === 0) {
      throw new Error(`Unrecognized quantity: "${raw}"`);
    }
    return parseInt(fraction[1], 10) / denominator;
  }
  return parseFloat(raw);
}

// Volume units are density-dependent; without a density we'd silently
// assume water (1ml = 1g), which is wrong for foods like oil or flour.
export function parseQuantityToGrams(
  quantityStr: string,
  gramsPerMl?: number,
): number {
  if (!quantityStr) return 0;
  const match = quantityStr.match(
    /^\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(g|kg|ml|l|oz|lb|cup|tbsp|tsp)?\s*$/i,
  );
  if (!match) {
    throw new Error(`Unrecognized quantity: "${quantityStr}"`);
  }
  const val = parseQuantityValue(match[1]);
  const unit = (match[2] ?? "g").toLowerCase();

  const volumeToMl: Record<string, number> = {
    l: 1000,
    ml: 1,
    cup: 240,
    tbsp: 15,
    tsp: 5,
  };
  if (unit in volumeToMl) {
    if (gramsPerMl === undefined) {
      throw new Error(
        `Cannot convert volume unit "${unit}" to grams without a density (gramsPerMl).`,
      );
    }
    return val * volumeToMl[unit] * gramsPerMl;
  }

  switch (unit) {
    case "kg":
      return val * 1000;
    case "oz":
      return val * 28.35;
    case "lb":
      return val * 453.6;
    default:
      return val;
  }
}

export function calculateNutrients(
  nutrientsPer100g: FoodNutrients,
  quantityG: number,
): FoodNutrients {
  const factor = quantityG / 100;
  return {
    calories: Math.round(nutrientsPer100g.calories * factor * 10) / 10,
    protein_g: Math.round(nutrientsPer100g.protein_g * factor * 10) / 10,
    carbs_g: Math.round(nutrientsPer100g.carbs_g * factor * 10) / 10,
    fat_g: Math.round(nutrientsPer100g.fat_g * factor * 10) / 10,
  };
}

export interface MacroTotals {
  cal: number;
  pro: number;
  carb: number;
  fat: number;
}

export function dayTotals(day: NutritionDay): MacroTotals {
  return day.meals.reduce(
    (acc, meal) => {
      meal.foods.forEach((f) => {
        acc.cal += Number(f.calories ?? 0);
        acc.pro += Number(f.protein_g ?? 0);
        acc.carb += Number(f.carbs_g ?? 0);
        acc.fat += Number(f.fat_g ?? 0);
      });
      return acc;
    },
    { cal: 0, pro: 0, carb: 0, fat: 0 },
  );
}

export function mealTotals(meal: Meal): MacroTotals {
  return meal.foods.reduce(
    (acc, f) => {
      acc.cal += Number(f.calories ?? 0);
      acc.pro += Number(f.protein_g ?? 0);
      acc.carb += Number(f.carbs_g ?? 0);
      acc.fat += Number(f.fat_g ?? 0);
      return acc;
    },
    { cal: 0, pro: 0, carb: 0, fat: 0 },
  );
}

export function planTotals(days: NutritionDay[]): MacroTotals {
  return days.reduce(
    (acc, day) => {
      const t = dayTotals(day);
      acc.cal += t.cal;
      acc.pro += t.pro;
      acc.carb += t.carb;
      acc.fat += t.fat;
      return acc;
    },
    { cal: 0, pro: 0, carb: 0, fat: 0 },
  );
}

export function healthScore(plan: NutritionPlan): number {
  const {
    calories = 0,
    protein_g = 0,
    carbs_g = 0,
    fat_g = 0,
  } = plan.daily_totals ?? {};
  if (calories === 0) return 0;
  const pR = (protein_g * 4) / calories;
  const cR = (carbs_g * 4) / calories;
  const fR = (fat_g * 9) / calories;
  const bal =
    1 - Math.abs(pR - 0.3) - Math.abs(cR - 0.45) - Math.abs(fR - 0.25);
  return Math.min(10, Math.max(1, Math.round(bal * 12)));
}

export function scoreColor(s: number): string {
  return s >= 8 ? "text-green-500" : s >= 6 ? "text-amber-500" : "text-red-500";
}

export function scoreBg(s: number): string {
  return s >= 8 ? "bg-green-500" : s >= 6 ? "bg-amber-500" : "bg-red-400";
}

export interface MealColorSet {
  bg: string;
  border: string;
  icon: string;
}

export const mealColors: MealColorSet[] = [
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
  {
    bg: "bg-rose-50 dark:bg-rose-900/15",
    border: "border-rose-200 dark:border-rose-800/30",
    icon: "text-rose-500",
  },
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Snack", "Dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export function classifyMealName(name: string): MealType | "Other" {
  const n = name.toLowerCase().trim();
  if (n.includes("breakfast") || n.includes("morning")) return "Breakfast";
  if (n.includes("lunch") || n.includes("midday")) return "Lunch";
  if (n.includes("snack") || n.includes("bite")) return "Snack";
  if (n.includes("dinner") || n.includes("supper") || n.includes("evening"))
    return "Dinner";
  return "Other";
}

export function getMealTypes(plan: NutritionPlan): MealType[] {
  const types = new Set<MealType>();
  plan.days?.forEach((day) =>
    day.meals.forEach((meal) => {
      const type = classifyMealName(meal.meal_name);
      if (type !== "Other") types.add(type);
    }),
  );
  return Array.from(types);
}

export function getMealBadgeStyles(type: MealType | string) {
  const map: Record<string, string> = {
    Breakfast:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    Lunch:
      "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400",
    Dinner:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    Snack:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    Other:
      "bg-slate-100  text-slate-600  dark:bg-slate-800     dark:text-slate-400",
  };
  return map[type] ?? map["Other"];
}
