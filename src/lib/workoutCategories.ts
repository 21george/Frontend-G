/**
 * Workout Category Utilities
 * Categorises a list of exercises into a single workout type and provides
 * display configuration (icon, colour, label) for each category.
 */

import type { Exercise } from '@/types'

export type WorkoutCategory = 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'functional' | 'rest' | 'mixed'

// ── Keyword maps for auto-detection ─────────────────────────────────────────
const STRENGTH_KEYWORDS  = ['bench', 'squat', 'deadlift', 'press', 'row', 'curl', 'extension', 'fly', 'pulldown', 'pullup', 'dip', 'shrug', 'lunge', 'leg press', 'chest', 'shoulder', 'tricep', 'bicep', 'back', 'weightlifting', 'barbell', 'dumbbell', 'cable']
const CARDIO_KEYWORDS    = ['run', 'jog', 'cycle', 'bike', 'swim', 'walk', 'treadmill', 'elliptical', 'row', 'jump rope', 'stair', 'sprint', 'cardio']
const HIIT_KEYWORDS      = ['hiit', 'burpee', 'circuit', 'interval', 'box jump', 'mountain climber', 'jump squat', 'plyometric', 'tabata', 'amrap']
const FLEXIBILITY_KEYWORDS = ['stretch', 'yoga', 'pilates', 'mobility', 'foam roll', 'flexibility', 'hip flexor', 'hamstring stretch', 'cool', 'warm']
const FUNCTIONAL_KEYWORDS  = ['plank', 'core', 'balance', 'stability', 'functional', 'kettlebell', 'band', 'bosu', 'trx', 'medicine ball']

function scoreKeywords(names: string[], keywords: string[]): number {
  return names.reduce((count, n) => {
    const lower = n.toLowerCase()
    return count + (keywords.some(k => lower.includes(k)) ? 1 : 0)
  }, 0)
}

/**
 * Infers the dominant category of a given exercise list.
 * Returns 'mixed' when no single category dominates, 'rest' when empty.
 */
export function getWorkoutCategory(exercises: Exercise[]): WorkoutCategory {
  if (!exercises || exercises.length === 0) return 'rest'
  const names = exercises.map(e => e.name ?? '')

  const scores: Record<WorkoutCategory, number> = {
    strength:    scoreKeywords(names, STRENGTH_KEYWORDS),
    cardio:      scoreKeywords(names, CARDIO_KEYWORDS),
    hiit:        scoreKeywords(names, HIIT_KEYWORDS),
    flexibility: scoreKeywords(names, FLEXIBILITY_KEYWORDS),
    functional:  scoreKeywords(names, FUNCTIONAL_KEYWORDS),
    mixed:       0,
    rest:        0,
  }

  const best = (Object.entries(scores) as [WorkoutCategory, number][])
    .filter(([k]) => k !== 'mixed' && k !== 'rest')
    .sort(([, a], [, b]) => b - a)[0]

  if (!best || best[1] === 0) return exercises.length > 0 ? 'strength' : 'rest'

  // If the runner-up is close, call it mixed
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a)
  if (sorted[1] && sorted[1][1] >= best[1] * 0.7 && sorted[1][1] > 0) return 'mixed'

  return best[0]
}

// ── Display configuration ────────────────────────────────────────────────────
export interface CategoryConfig {
  label: string
  icon: string   // emoji
  color: string  // CSS colour
  bg: string     // CSS background
}

export const CATEGORY_CONFIG: Record<WorkoutCategory, CategoryConfig> = {
  strength:    { label: 'Strength',    icon: '🏋️', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  cardio:      { label: 'Cardio',      icon: '🏃', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  hiit:        { label: 'HIIT',        icon: '⚡', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  flexibility: { label: 'Flexibility', icon: '🧘', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  functional:  { label: 'Functional',  icon: '💪', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  mixed:       { label: 'Mixed',       icon: '🔥', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  rest:        { label: 'Rest',        icon: '😴', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)'},
}
