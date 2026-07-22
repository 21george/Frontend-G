"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchFoods, useCreateFood } from "@/lib/hooks";
import { Search, Loader2, UtensilsCrossed, Plus } from "lucide-react";
import type { Food } from "@/types";

interface FoodSearchProps {
  value: string;
  onChange: (name: string) => void;
  onSelect: (food: Food) => void;
  placeholder?: string;
}

export default function FoodSearch({
  value,
  onChange,
  onSelect,
  placeholder = "Search food (e.g. chicken, rice)...",
}: FoodSearchProps) {
  const [open, setOpen] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customNutrients, setCustomNutrients] = useState({
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useSearchFoods(value);
  const foods = data?.foods ?? [];
  const createFood = useCreateFood();

  const handleSelect = useCallback(
    (food: Food) => {
      onSelect(food);
      setOpen(false);
      setShowCustomForm(false);
      inputRef.current?.blur();
    },
    [onSelect],
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        if (foods.length > 0 && !showCustomForm) {
          handleSelect(foods[0]);
        } else {
          setOpen(false);
          setShowCustomForm(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, foods, showCustomForm, handleSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setShowCustomForm(false);
    }
    if (e.key === "Enter" && foods.length > 0 && open && !showCustomForm) {
      e.preventDefault();
      handleSelect(foods[0]);
    }
  };

  const handleCreateCustom = async () => {
    if (!value.trim()) return;
    const nutrients = {
      calories: Number(customNutrients.calories) || 0,
      protein_g: Number(customNutrients.protein_g) || 0,
      carbs_g: Number(customNutrients.carbs_g) || 0,
      fat_g: Number(customNutrients.fat_g) || 0,
    };
    try {
      const result = await createFood.mutateAsync({
        name: value.trim(),
        nutrients_per_100g: nutrients,
      });
      // The backend returns { id, name, nutrients_per_100g, source }
      const newFood: Food = {
        id: result?.data?.id,
        name: value.trim(),
        nutrients_per_100g: nutrients,
        source: "custom",
      };
      handleSelect(newFood);
      setShowCustomForm(false);
      setCustomNutrients({
        calories: "",
        protein_g: "",
        carbs_g: "",
        fat_g: "",
      });
    } catch {
      // mutation toast handles error
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onKeyDown={handleKeyDown}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(e.target.value.length >= 2);
            setShowCustomForm(false);
          }}
          onFocus={() => value.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-[#121212] border border-[var(--border)] dark:border-white/[0.07] rounded-lg text-[var(--text-primary)] dark:text-[var(--text-primary)] placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none focus:border-green-400 dark:focus:border-green-500/60 transition-colors"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {open && (
        <>
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1A1A1A] border border-[var(--border)] dark:border-white/[0.07] rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {foods.length === 0 && !isLoading && !showCustomForm && (
              <div className="px-4 py-3 space-y-2">
                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4" />
                  {isError
                    ? "Could not reach food database. Check your connection."
                    : "No foods found. Try a different name or add a custom food."}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold"
                >
                  <Plus className="w-3 h-3" /> Add "{value}" to my food library
                </button>
              </div>
            )}

            {showCustomForm && (
              <div className="px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                  Add custom food:{" "}
                  <span className="font-normal italic">{value}</span>
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: "calories", label: "kcal/100g" },
                    { key: "protein_g", label: "P(g)" },
                    { key: "carbs_g", label: "C(g)" },
                    { key: "fat_g", label: "F(g)" },
                  ].map(({ key, label }) => (
                    <input
                      key={key}
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder={label}
                      value={
                        customNutrients[key as keyof typeof customNutrients]
                      }
                      onChange={(e) =>
                        setCustomNutrients((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#121212] border border-[var(--border)] dark:border-white/[0.07] rounded text-[var(--text-primary)] dark:text-[var(--text-primary)] placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none focus:border-green-400 dark:focus:border-green-500/60"
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateCustom}
                    disabled={createFood.isPending}
                    className="flex-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-colors disabled:opacity-50"
                  >
                    {createFood.isPending ? "Saving…" : "Save & Select"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="px-3 py-1.5 text-xs border border-[var(--border)] dark:border-white/[0.07] text-[var(--text-primary)] dark:text-[var(--text-primary)] rounded hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {foods.map((food) => (
              <button
                key={food.id ?? food.fdc_id ?? food.name}
                type="button"
                onClick={() => handleSelect(food)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors border-b border-slate-100 dark:border-white/[0.04] last:border-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)] dark:text-[var(--text-primary)] truncate pr-2">
                    {food.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 font-medium flex-shrink-0 uppercase">
                    {food.source}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{food.nutrients_per_100g.calories} kcal/100g</span>
                  <span>P {food.nutrients_per_100g.protein_g}g</span>
                  <span>C {food.nutrients_per_100g.carbs_g}g</span>
                  <span>F {food.nutrients_per_100g.fat_g}g</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
