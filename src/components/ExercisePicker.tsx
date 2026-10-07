"use client";

import { useState } from "react";
import { Search, X, Dumbbell, ImageIcon } from "lucide-react";
import { useExercises } from "@/hooks/useExercises";
import type { ExerciseLibraryItem } from "@/lib/api/services/exercises";

interface ExercisePickerProps {
  onSelect: (exercise: ExerciseLibraryItem) => void;
  onClose: () => void;
}

export default function ExercisePicker({ onSelect, onClose }: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [muscle, setMuscle] = useState("");

  const { data, isLoading } = useExercises({
    q: query,
    category: category || undefined,
    muscle: muscle || undefined,
    page: 1,
    per_page: 20,
  });

  const exercises = data?.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] w-full max-w-2xl mx-4 max-h-[80vh] rounded-xl border border-[var(--border)] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Exercise Library</h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-5 py-3 border-b border-[var(--border)] space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises (e.g., squat, bench press)..."
              className="input pl-10 w-full"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input text-sm flex-1"
            >
              <option value="">All Categories</option>
              <option value="Chest">Chest</option>
              <option value="Back">Back</option>
              <option value="Shoulders">Shoulders</option>
              <option value="Arms">Arms</option>
              <option value="Legs">Legs</option>
              <option value="Abs">Abs</option>
              <option value="Cardio">Cardio</option>
            </select>
            <select
              value={muscle}
              onChange={(e) => setMuscle(e.target.value)}
              className="input text-sm flex-1"
            >
              <option value="">All Muscles</option>
              <option value="Biceps brachii">Biceps</option>
              <option value="Triceps brachii">Triceps</option>
              <option value="Pectoralis major">Chest</option>
              <option value="Latissimus dorsi">Lats</option>
              <option value="Rectus abdominis">Abs</option>
              <option value="Quadriceps femoris">Quads</option>
              <option value="Gluteus maximus">Glutes</option>
              <option value="Hamstrings">Hamstrings</option>
              <option value="Deltoid">Delts</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {isLoading ? (
            <div className="text-center text-sm text-[var(--text-secondary)] py-8">Searching...</div>
          ) : exercises.length === 0 ? (
            <div className="text-center text-sm text-[var(--text-secondary)] py-8">
              {query ? "No exercises found. Try a different search." : "Start typing to search exercises..."}
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => onSelect(ex)}
                  className="w-full text-left bg-[var(--bg-subtle)] hover:bg-blue-50 dark:hover:bg-blue-900/20 p-3 rounded-lg border border-[var(--border)] hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {ex.images?.[0] ? (
                        <img src={ex.images[0]} alt={ex.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">{ex.name}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {ex.category}
                        {ex.muscles?.length > 0 && (
                          <> · {ex.muscles.slice(0, 3).join(", ")}</>
                        )}
                      </p>
                      {ex.equipment?.length > 0 && (
                        <p className="text-xs text-slate-500 mt-0.5">{ex.equipment.join(", ")}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
