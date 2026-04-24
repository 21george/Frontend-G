'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  useClient, useClientAnalytics, useMessages, useSendMessage,
  useCheckins, useCreateCheckin, useWorkoutPlans, useNutritionPlans,
  useNutritionPlan, useRegenerateCode, useClientMedia, useWorkoutLogs,
  useUpdateNutritionPlan, useDeleteWorkoutPlan, useDeleteClient, useUpdateClient,
  useUploadMessageMedia,
} from '@/lib/hooks'
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  ArrowLeft, Copy, Check, RefreshCw, Send, Video,
  Image as ImageIcon, Dumbbell, Salad, BarChart2,
  MessageCircle, Calendar as CalendarIcon, Phone,
  FileText, ExternalLink, ChevronLeft, ChevronRight, ChevronDown,
  Plus, Search, MoreVertical, Tag, User, X, Menu,
  CheckCircle2, Clock, PhoneCall, Hash, Wifi, WifiOff, Loader2,
  Pencil, Trash2, Paperclip, Download, Play,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// Navigation handler for back button
const goBack = (router: ReturnType<typeof useRouter>) => {
  // Try to go back in history, fallback to clients page
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/clients')
  }
}

// Color constants from design system - using only existing colors
const COLORS = {
  // Primary
  cyan950: '#083344',
  cyan900: '#0c4a5e',
  // Accents
  orange500: '#f97316',
  blue500: '#3b82f6',
  emerald500: '#10b981',
  // Neutrals
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  // Dark mode
  darkBg: '#141414',
  darkCard: '#171717',
} as const
import { formatDate, timeAgo } from '@/lib/utils'
import { useSocketChat } from '@/lib/useSocketChat'
import type { CheckinMeeting, NutritionPlan, WorkoutPlan, WorkoutLogDetailed } from '@/types'

const DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

interface CalendarEvent {
  id: string; title: string; date: Date
  type: 'checkin' | 'workout'; color: string
  details?: string; planId?: string
}

const DAY_MAP: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
  mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
}

function getDateForDay(weekStart: string, dayName: string): Date {
  const start = new Date(weekStart)
  const result = new Date(start)
  result.setDate(start.getDate() + (DAY_MAP[dayName.toLowerCase()] ?? 0))
  return result
}

interface DayData {
  date: number | null; currentMonth: boolean
  isToday: boolean; isWeekend: boolean
  events: CalendarEvent[]; fullDate: Date | null
}

function generateCalendarDays(year: number, month: number, events: CalendarEvent[]): DayData[][] {
  const firstDay        = new Date(year, month, 1)
  const today           = new Date()
  let startDay          = firstDay.getDay() - 1
  if (startDay < 0) startDay = 6
  const daysInMonth     = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const weeks: DayData[][] = []
  let week: DayData[]  = []
  let nextDay          = 1

  for (let i = startDay - 1; i >= 0; i--)
    week.push({ date: daysInPrevMonth - i, currentMonth: false, isToday: false, isWeekend: false, events: [], fullDate: new Date(year, month - 1, daysInPrevMonth - i) })

  for (let d = 1; d <= daysInMonth; d++) {
    const fullDate  = new Date(year, month, d)
    const dow       = fullDate.getDay()
    week.push({
      date: d, currentMonth: true,
      isToday: fullDate.toDateString() === today.toDateString(),
      isWeekend: dow === 0 || dow === 6,
      events: events.filter(e => { const ed = new Date(e.date); return ed.getFullYear()===year && ed.getMonth()===month && ed.getDate()===d }),
      fullDate,
    })
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  while (week.length > 0 && week.length < 7)
    week.push({ date: nextDay, currentMonth: false, isToday: false, isWeekend: false, events: [], fullDate: new Date(year, month+1, nextDay++) })
  if (week.length > 0) weeks.push(week)
  return weeks
}

type TabKey = 'calendar' | 'workouts' | 'nutrition' | 'analytics' | 'messages' | 'checkins'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'calendar',  label: 'Calendar'   },
  { key: 'workouts',  label: 'Workouts'   },
  { key: 'nutrition', label: 'Nutrition'  },
  { key: 'analytics', label: 'Analytics'  },
  { key: 'messages',  label: 'Messages'   },
  { key: 'checkins',  label: 'Schedule'  },
]

// ── Workout category detection ────────────────────────────────────────────────
type WorkoutCategory = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'cardio' | 'core' | 'fullbody'

function getWorkoutCategory(exercises: { name: string }[]): WorkoutCategory {
  if (!exercises?.length) return 'fullbody'
  const names = exercises.map(e => e.name.toLowerCase()).join(' ')
  if (/bench|chest|push.?up|pec|\bfly\b/.test(names)) return 'chest'
  if (/squat|lunge|quad|hamstring|glute|calf|leg press|rdl/.test(names)) return 'legs'
  if (/pull.?up|pull.?down|row|lat |back|deadlift/.test(names)) return 'back'
  if (/shoulder|overhead press|raise|delt|ohp/.test(names)) return 'shoulders'
  if (/curl|tricep|bicep|\barm\b/.test(names)) return 'arms'
  if (/run|cardio|bike|swim|jump|sprint|treadmill|hiit|burpee/.test(names)) return 'cardio'
  if (/plank|crunch|sit.?up|\babs\b|core|oblique/.test(names)) return 'core'
  return 'fullbody'
}

const CATEGORY_CONFIG: Record<WorkoutCategory, { label: string; color: string; bg: string; icon: string }> = {
  chest:      { label: 'Chest',      color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   icon: '🏋️' },
  back:       { label: 'Back',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)',  icon: '🔝' },
  legs:       { label: 'Legs',       color: '#f97316', bg: 'rgba(249,115,22,0.08)',  icon: '🦵' },
  shoulders:  { label: 'Shoulders',  color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  icon: '💪' },
  arms:       { label: 'Arms',       color: '#10b981', bg: 'rgba(16,185,129,0.08)',  icon: '💪' },
  cardio:     { label: 'Cardio',     color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  icon: '🏃' },
  core:       { label: 'Core',       color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   icon: '🧘' },
  fullbody:   { label: 'Full Body',  color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  icon: '⚡' },
}

// Schedule type colors - using standard palette
const SCHEDULE_TYPE_COLORS = {
  video: { bg: 'bg-blue-100 dark:bg-blue-900/25', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/50' },
  call: { bg: 'bg-emerald-100 dark:bg-emerald-900/25', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/50' },
  chat: { bg: 'bg-purple-100 dark:bg-purple-900/25', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/50' },
} as const

// ── Schedule form ─────────────────────────────────────────────────────────────
// ── Nutrition plan expanded card (fetches full details) ────────────────────────
function NutritionPlanCard({ planId }: { planId: string }) {
  const { data: plan, isLoading } = useNutritionPlan(planId)

  if (isLoading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 size={16} className="animate-spin text-slate-600" />
    </div>
  )
  if (!plan || !(plan.days ?? []).length) return (
    <div className="px-4 py-6 text-center">
      <p className="text-[12px] text-slate-600">No meals added to this plan yet</p>
    </div>
  )

  return (
    <div className="divide-y divide-slate-200 dark:divide-white/[0.04]">
      {plan.days.map((day, di) => {
        const dayTotals = day.meals.reduce((acc, m) => {
          m.foods.forEach(f => { acc.cal += f.calories; acc.p += f.protein_g; acc.c += f.carbs_g; acc.f += f.fat_g })
          return acc
        }, { cal: 0, p: 0, c: 0, f: 0 })

        return (
          <div key={di}>
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02]">
              <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{day.day}</p>
              <div className="flex gap-3 text-[10px] text-slate-600">
                <span>{dayTotals.cal} kcal</span>
                <span>P {dayTotals.p}g</span>
                <span>C {dayTotals.c}g</span>
                <span>F {dayTotals.f}g</span>
              </div>
            </div>

            {/* Meals */}
            <div className="px-4 py-2 space-y-3">
              {day.meals.map((meal, mi) => {
                const mealTotals = meal.foods.reduce((acc, f) => {
                  acc.cal += f.calories; acc.p += f.protein_g; acc.c += f.carbs_g; acc.f += f.fat_g
                  return acc
                }, { cal: 0, p: 0, c: 0, f: 0 })

                return (
                  <div key={mi}>
                    {/* Meal name + time */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-900 dark:text-white">{meal.meal_name}</span>
                        {meal.time && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-600 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.05] px-1.5 py-0.5 rounded">
                            {meal.time}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 text-[10px] text-slate-600">
                        <span className="text-amber-500/70">{mealTotals.cal} cal</span>
                      </div>
                    </div>

                    {/* Foods table */}
                    <div className="rounded-lg border border-slate-200 dark:border-white/[0.05] overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-600">
                            <th className="text-left px-3 py-1.5 font-semibold">Food</th>
                            <th className="text-left px-2 py-1.5 font-semibold">Qty</th>
                            <th className="text-right px-2 py-1.5 font-semibold">Cal</th>
                            <th className="text-right px-2 py-1.5 font-semibold text-blue-400/60">P</th>
                            <th className="text-right px-2 py-1.5 font-semibold text-green-400/60">C</th>
                            <th className="text-right px-3 py-1.5 font-semibold text-rose-400/60">F</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                          {meal.foods.map((food, fi) => (
                            <tr key={fi} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300 font-medium">{food.name}</td>
                              <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400">{food.quantity}</td>
                              <td className="px-2 py-1.5 text-right text-amber-400/80">{food.calories}</td>
                              <td className="px-2 py-1.5 text-right text-blue-400/70">{food.protein_g}g</td>
                              <td className="px-2 py-1.5 text-right text-green-400/70">{food.carbs_g}g</td>
                              <td className="px-3 py-1.5 text-right text-rose-400/70">{food.fat_g}g</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Notes */}
      {plan.notes && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.01]">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Notes</p>
          <p className="text-[12px] text-slate-400 leading-relaxed">{plan.notes}</p>
        </div>
      )}
    </div>
  )
}

function NutritionListCard({
  plan,
  expanded,
  onToggle,
}: {
  plan: NutritionPlan
  expanded: boolean
  onToggle: () => void
}) {
  const updateNutritionPlan = useUpdateNutritionPlan(plan.id)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(plan.title)

  useEffect(() => {
    setDraftTitle(plan.title)
  }, [plan.title])

  const handleCancelEdit = () => {
    setDraftTitle(plan.title)
    setIsEditingTitle(false)
  }

  const handleSaveTitle = async () => {
    const trimmedTitle = draftTitle.trim()
    if (!trimmedTitle) return
    if (trimmedTitle === plan.title) {
      setIsEditingTitle(false)
      return
    }

    try {
      await updateNutritionPlan.mutateAsync({ title: trimmedTitle })
      setIsEditingTitle(false)
    } catch {
      window.alert('Failed to update nutrition plan title.')
    }
  }

  return (
    <div className=" border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[rgba(30,41,59,0.2)] p-3 sm:p-4 hover:border-[#0d59f2]/50 transition-colors shadow-sm dark:shadow-none">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          onClick={onToggle}
          className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-[#333333] dark:to-[#141414] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center text-left self-start"
        >
          <Salad className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-600 dark:text-white" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2 gap-3">
            <button
              onClick={onToggle}
              className="text-left flex-1 min-w-0"
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Nutrition Plan
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Week of {new Date(plan.week_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {isEditingTitle ? (
                <input
                  autoFocus
                  value={draftTitle}
                  onChange={e => setDraftTitle(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSaveTitle()
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      handleCancelEdit()
                    }
                  }}
                  className="w-full max-w-md rounded-lg border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#141414] px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0d59f2]"
                />
              ) : (
                <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-1 truncate">
                  {plan.title}
                </h3>
              )}
              <p className="text-xs text-slate-500 dark:text-[#94a3b8] line-clamp-2">
                {plan.notes?.trim() || 'Daily nutrition plan with full meal and macro breakdown.'}
              </p>
            </button>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-[#64748b]">Avg Daily</span>
              <span className="font-semibold text-sm sm:text-base text-emerald-600 dark:text-emerald-300">
                {plan.daily_totals.calories} kcal
              </span>
              {isEditingTitle ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                    aria-label="Cancel title edit"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={handleSaveTitle}
                    disabled={updateNutritionPlan.isPending || !draftTitle.trim()}
                    className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                    aria-label="Save title"
                  >
                    {updateNutritionPlan.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                  aria-label="Edit nutrition plan title"
                >
                  <Pencil size={14} />
                </button>
              )}
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                aria-label="Toggle nutrition plan details"
              >
                <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-3 sm:gap-4 text-slate-500 dark:text-[#94a3b8] flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-[11px] sm:text-xs">{plan.daily_totals.calories} kcal</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] sm:text-xs">{plan.daily_totals.carbs_g}g carbs</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] sm:text-xs">{plan.daily_totals.protein_g}g protein</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] sm:text-xs">{plan.daily_totals.fat_g}g fats</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/nutrition-plans/${plan.id}`}
                className="bg-cyan-950 hover:bg-cyan-900 px-4 py-2 rounded-lg font-semibold text-xs text-white transition-colors"
              >
                Open Plan
              </Link>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141414]/50 overflow-hidden">
          <NutritionPlanCard planId={plan.id} />
        </div>
      )}
    </div>
  )
}

interface ScheduleForm {
  date: string; time: string
  type: 'call' | 'video' | 'chat'
  meeting_link: string; notes: string
}
const DEFAULT_FORM: ScheduleForm = { date: '', time: '09:00', type: 'video', meeting_link: '', notes: '' }

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab]               = useState<TabKey>('calendar')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [msg, setMsg]               = useState('')
  const [copied, setCopied]         = useState(false)
  const [newCode, setNewCode]       = useState<string | null>(null)
  const [calendarDate, setCalDate]  = useState(new Date())
  // Schedule modal
  const [scheduleModal, setScheduleModal] = useState<{ open: boolean; date: Date | null }>({ open: false, date: null })
  const [scheduleForm, setScheduleForm]   = useState<ScheduleForm>(DEFAULT_FORM)
  const [scheduling, setScheduling]       = useState(false)
  // Check-in chat panel (which check-in ID has chat open)
  const [activeChatId, setActiveChatId]   = useState<string | null>(null)
  const [expandedPlan, setExpandedPlan]   = useState<string | null>(null)
  const chatEndRef      = useRef<HTMLDivElement>(null)
  const messagesEndRef  = useRef<HTMLDivElement>(null)

  const { data: client, isLoading }            = useClient(id)
  const { data: analytics }                     = useClientAnalytics(id)
  const { data: messagesData, isLoading: msgLoading } = useMessages(id)
  const { data: checkins }          = useCheckins(id)
  const { data: plans }             = useWorkoutPlans(id)
  const { data: nutrition }         = useNutritionPlans(id)
  const { data: media }             = useClientMedia(id)
  const { data: workoutLogs }       = useWorkoutLogs(id)
  const sendMsg                     = useSendMessage()
  const uploadMedia                 = useUploadMessageMedia()
  const regenerateCode              = useRegenerateCode(id)
  const fileInputRef                = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<{ media_url: string; media_type: string; media_filename: string } | null>(null)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const createCheckin               = useCreateCheckin()
  const deleteWorkoutPlan           = useDeleteWorkoutPlan()
  const deleteClient                = useDeleteClient()
  const updateClient                = useUpdateClient(id)
  const { connected: socketConnected, incomingMessages, relayViaSocket, clearIncoming } = useSocketChat(id)

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const ev: CalendarEvent[] = []
    ;(checkins ?? []).forEach(c => ev.push({
      id: `ci-${c.id}`,
      title: c.type === 'video' ? 'Video Call' : c.type === 'call' ? 'Phone Call' : 'Check-in',
      date: new Date(c.scheduled_at), type: 'checkin', color: '#ef4444', details: c.notes,
    }))
    ;(plans?.data ?? []).forEach(p => {
      if (p.days?.length) {
        p.days.forEach((day, i) => {
          const n = day.exercises?.length ?? 0
          ev.push({
            id: `wp-${p.id}-${i}`, title: `${day.day}: ${p.title}`,
            date: getDateForDay(p.week_start, day.day), type: 'workout', color: '#3b82f6',
            details: n ? `${n} exercises: ${day.exercises!.slice(0,2).map(e=>e.name).join(', ')}${n>2?'...':''}` : undefined,
            planId: p.id,
          })
        })
      } else {
        ev.push({ id: `wp-${p.id}`, title: p.title, date: new Date(p.week_start), type: 'workout', color: '#3b82f6', planId: p.id })
      }
    })
    return ev
  }, [checkins, plans])

  const calendarWeeks = useMemo(
    () => generateCalendarDays(calendarDate.getFullYear(), calendarDate.getMonth(), calendarEvents),
    [calendarDate, calendarEvents]
  )

  const prevMonth = () => setCalDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))
  const nextMonth = () => setCalDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))
  const goToToday = () => setCalDate(new Date())

  const handleSend = async () => {
    if (!msg.trim() && !pendingFile) return
    const content = msg.trim() || (pendingFile ? `📎 ${pendingFile.media_filename}` : '')
    setMsg('')
    const payload: Parameters<typeof sendMsg.mutateAsync>[0] = { client_id: id, content }
    if (pendingFile) {
      payload.media_url = pendingFile.media_url
      payload.media_type = pendingFile.media_type
      payload.media_filename = pendingFile.media_filename
      setPendingFile(null)
    }
    await sendMsg.mutateAsync(payload)
    relayViaSocket(content)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await uploadMedia.mutateAsync(file)
      setPendingFile(result)
    } catch {
      window.alert('Failed to upload file.')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRegenerate = async () => {
    if (!confirm('Regenerate code? The old code will stop working immediately.')) return
    const res = await regenerateCode.mutateAsync()
    setNewCode(res.data.login_code)
  }

  const handleDeleteWorkout = async (plan: WorkoutPlan) => {
    if (!confirm(`Delete workout plan "${plan.title}"? This cannot be undone.`)) return

    try {
      if (expandedPlan === plan.id) setExpandedPlan(null)
      await deleteWorkoutPlan.mutateAsync(plan.id)
    } catch {
      window.alert('Failed to delete workout plan.')
    }
  }

  const handleDeleteClient = async () => {
    if (!confirm(`Permanently delete client "${client?.name}"? This action cannot be undone.`)) return

    try {
      await deleteClient.mutateAsync(id)
      router.push('/clients')
    } catch {
      window.alert('Failed to delete client.')
    }
  }

  const handleToggleBlockClient = async () => {
    const nextActiveState = !client?.active

    if (!confirm(`${nextActiveState ? 'Unblock' : 'Block'} client "${client?.name}"?`)) return

    try {
      await updateClient.mutateAsync({ active: nextActiveState })
    } catch {
      window.alert(`Failed to ${nextActiveState ? 'unblock' : 'block'} client.`)
    }
  }

  // ── Schedule from calendar ────────────────────────────────────────────────
  const openScheduleModal = useCallback((date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    setScheduleForm({ ...DEFAULT_FORM, date: dateStr })
    setScheduleModal({ open: true, date })
  }, [])

  const handleScheduleSubmit = async () => {
    if (!scheduleForm.date || !scheduleForm.time) return
    setScheduling(true)
    try {
      await createCheckin.mutateAsync({
        client_id: id,
        scheduled_at: `${scheduleForm.date}T${scheduleForm.time}:00`,
        type: scheduleForm.type,
        meeting_link: scheduleForm.meeting_link || undefined,
        notes: scheduleForm.notes || undefined,
        status: 'scheduled',
      })
      setScheduleModal({ open: false, date: null })
      setScheduleForm(DEFAULT_FORM)
    } finally {
      setScheduling(false)
    }
  }

  // ── Video call room URL ───────────────────────────────────────────────────
  const getVideoRoom = (c: CheckinMeeting) =>
    c.meeting_link || `https://meet.jit.si/CoachPro-${c.id.replace(/-/g, '')}`

  const allMessages = useMemo(() => {
    const rest: any[] = messagesData?.data ?? []
    const restIds = new Set(rest.map((m: any) => m.id))
    const extra = incomingMessages.filter(sm => !restIds.has(sm.id))
    if (extra.length === 0) return rest
    return [...rest, ...extra].sort((a: any, b: any) =>
      new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
    )
  }, [messagesData, incomingMessages])

  useEffect(() => {
    if (tab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [allMessages, tab])

  const completedDaysMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    ;(workoutLogs ?? []).forEach((l: any) => {
      map[`${l.workout_plan_id}-${l.day?.toLowerCase()}`] = true
    })
    return map
  }, [workoutLogs])

  if (isLoading) return (
    <DashboardLayout>
      <div className="fixed top-16 lg:top-0 left-0 lg:left-64 right-0 bottom-0 flex flex-col bg-slate-50 dark:bg-[#141414] animate-pulse">
        <div className="h-11 bg-white dark:bg-[#171717] border-b border-slate-200 dark:border-white/[0.06]" />
        <div className="flex flex-1">
          <div className="hidden md:block w-[300px] border-r border-slate-200 dark:border-white/[0.06]" />
          <div className="flex-1 p-4 sm:p-6 space-y-4">
            <div className="h-7 w-52 bg-slate-200 dark:bg-white/[0.06] rounded-lg" />
            <div className="h-72 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )

  if (!client) return (
    <DashboardLayout>
      <div className="fixed top-16 lg:top-0 left-0 lg:left-64 right-0 bottom-0 flex items-center justify-center bg-slate-50 dark:bg-[#141414]">
        <p className="text-slate-500 text-sm">Client not found.</p>
      </div>
    </DashboardLayout>
  )

  const completedCheckins = (checkins ?? []).filter((c: any) => c.status === 'completed').length

  return (
    <DashboardLayout>
      <div className="fixed top-16 lg:top-0 left-0 lg:left-64 right-0 bottom-0 flex flex-col bg-slate-50 dark:bg-[#141414] overflow-hidden">

        {/* ── Breadcrumb header ─────────────────────────────────────── */}
        <header className="flex items-center justify-between px-3 sm:px-5 h-11 border-b border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#171717] flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase min-w-0">
            {/* Mobile sidebar toggle */}
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-white">
              <Menu size={16} />
            </button>
            <Link href="/clients" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex-shrink-0">
              <ArrowLeft size={13} /> <span className="hidden sm:inline">Clients</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
            <span className="text-slate-700 dark:text-slate-300 truncate">{client.name}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleToggleBlockClient}
              disabled={updateClient.isPending}
              title={client.active ? 'Temporarily disable client access' : 'Restore client access'}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                client.active
                  ? 'border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                  : 'border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
              }`}
            >
              {updateClient.isPending ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
              {client.active ? 'Block Access' : 'Restore Access'}
            </button>
            <button
              onClick={handleDeleteClient}
              disabled={deleteClient.isPending}
              title="Permanently delete this client (cannot be undone)"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/40 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {deleteClient.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete Permanently
            </button>
            <div className="hidden lg:flex items-center gap-2 bg-slate-100 dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/[0.07] rounded-lg px-3 py-1.5">
              <Search size={13} className="text-slate-500 dark:text-slate-600" />
              <input placeholder="Search" className="bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none w-28" />
              <kbd className="text-[10px] text-slate-500 dark:text-slate-700 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] px-1.5 py-0.5 rounded font-mono">⌘F</kbd>
            </div>
            <button className="text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors">
              <MoreVertical size={15} />
            </button>
          </div>
        </header>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ══════════ LEFT PANEL ══════════ */}
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
          )}
          <aside className={`
            fixed inset-y-0 left-0 z-40 w-[20rem] sm:w-[300px] transform transition-transform duration-200 ease-out
            md:relative md:inset-auto md:z-auto md:translate-x-0 md:w-[300px]
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            flex-shrink-0 border-r border-slate-200 dark:border-white/[0.06] overflow-y-auto bg-white dark:bg-[#141414]
          `}>
            {/* Mobile close button */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/[0.06]">
              <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Client Info</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>
            {/* Mobile-only action buttons (hidden from header on sm) */}
            <div className="sm:hidden flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.04]">
              <button onClick={handleToggleBlockClient} disabled={updateClient.isPending}
                title={client.active ? 'Temporarily disable client access' : 'Restore client access'}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                  client.active
                    ? 'border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300'
                    : 'border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                }`}>
                {updateClient.isPending ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                {client.active ? 'Block' : 'Restore'}
              </button>
              <button onClick={handleDeleteClient} disabled={deleteClient.isPending}
                title="Permanently delete this client (cannot be undone)"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/40 px-2 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-300 transition-colors disabled:opacity-50">
                {deleteClient.isPending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                Delete
              </button>
            </div>
            <div className="p-5 space-y-5">

              {/* Profile card */}
              <div className="flex items-start gap-3.5">
                <div className="w-[72px] h-[72px] rounded-xl bg-slate-100 dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {client.profile_photo_url
                    ? <img src={client.profile_photo_url} alt={client.name} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-semibold text-slate-900 dark:text-white">{client.name[0].toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white leading-snug truncate">{client.name}</h2>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium mt-0.5 mb-2.5 ${client.active ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${client.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {client.active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={handleRegenerate} title="Reset login code"
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2 py-1.5 transition-colors">
                      <RefreshCw size={10} className={regenerateCode.isPending ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              </div>

              {/* New login code card */}
              {newCode && (
                <div className="p-3.5 bg-blue-50 dark:bg-[#0f1a30] border border-[#2563eb]/25 rounded-xl">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-1">New Login Code</p>
                  <p className="text-2xl font-semibold font-mono tracking-widest text-slate-900 dark:text-white mb-2.5">{newCode}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(newCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-cyan-950 hover:bg-cyan-900 rounded-lg px-3 py-1.5 transition-colors">
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              )}

              <hr className="border-slate-200 dark:border-white/[0.05]" />

              {/* ── Specializations ── */}
              <section>
                <div className="flex items-center gap-1.5 mb-3">
                  <Tag size={12} className="text-slate-600" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Specializations</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/[0.09] text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.03]">
                    {client.language === 'en' ? 'English' : 'German'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-md border text-[11px] font-medium ${
                    client.active
                      ? 'border-emerald-500/25 text-emerald-400 bg-emerald-500/5'
                      : 'border-red-500/25 text-red-400 bg-red-500/5'
                  }`}>
                    {client.active ? 'Active Client' : 'Inactive'}
                  </span>
                  {(plans?.data?.length ?? 0) > 0 && (
                    <span className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/[0.09] text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.03]">
                      Has Workout Plans
                    </span>
                  )}
                  {(nutrition?.length ?? 0) > 0 && (
                    <span className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/[0.09] text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.03]">
                      On Nutrition Plan
                    </span>
                  )}
                </div>
              </section>

              <hr className="border-slate-200 dark:border-white/[0.05]" />

              {/* ── Certifications / Files ── */}
              <section>
                <div className="flex items-center gap-1.5 mb-3">
                  <FileText size={12} className="text-slate-600" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Files & Media</span>
                </div>
                <div className="space-y-1.5">
                  {(media ?? []).slice(0, 5).map(m => (
                    <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.14] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all group">
                      <div className="w-6 h-6 rounded-md bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center flex-shrink-0">
                        {m.type === 'video' ? <Video size={11} className="text-blue-400" /> : <ImageIcon size={11} className="text-slate-400" />}
                      </div>
                      <span className="text-[11px] text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors truncate flex-1">
                        {m.type === 'video' ? 'Video file' : 'Photo'}
                      </span>
                      <ExternalLink size={10} className="text-slate-700 group-hover:text-slate-500 flex-shrink-0" />
                    </a>
                  ))}
                  {(media ?? []).length === 0 && (
                    <p className="text-[11px] text-slate-700 italic">No files uploaded yet</p>
                  )}
                </div>
              </section>

              <hr className="border-slate-200 dark:border-white/[0.05]" />

              {/* ── General ── */}
              <section>
                <div className="flex items-center gap-1.5 mb-3">
                  <User size={12} className="text-slate-600" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">General</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-slate-600">Language</span>
                    <span className="text-[12px] text-slate-700 dark:text-slate-300">{client.language === 'en' ? 'English' : 'German'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-slate-600">Member since</span>
                    <span className="text-[12px] text-slate-700 dark:text-slate-300">{formatDate(client.created_at, 'dd MMM, yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-slate-600">Completion</span>
                    <span className="text-[12px] font-semibold text-blue-400">{analytics?.completion_rate ?? 0}%</span>
                  </div>
                </div>
              </section>

              <hr className="border-slate-200 dark:border-white/[0.05]" />

              {/* ── Available absences / Overview ── */}
              <section>
                <div className="flex items-center gap-1.5 mb-3">
                  <BarChart2 size={12} className="text-slate-600" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Available absences</span>
                </div>
                <div className="flex gap-2.5">
                  {/* Check-ins bar */}
                  <div className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-[3px] h-5 bg-[#f97316] rounded-full" />
                      <span className="text-[11px] text-slate-500">Check-ins</span>
                    </div>
                    <p className="text-base font-semibold text-slate-900 dark:text-white leading-none">
                      {completedCheckins}
                      <span className="text-slate-600 font-normal text-[12px]"> / {checkins?.length ?? 0}</span>
                    </p>
                  </div>
                  {/* Plans bar */}
                  <div className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-[3px] h-5 bg-cyan-950 rounded-full" />
                      <span className="text-[11px] text-slate-500">Plans</span>
                    </div>
                    <p className="text-base font-semibold text-slate-900 dark:text-white leading-none">
                      {analytics?.plans_count ?? plans?.data?.length ?? 0}
                      <span className="text-slate-600 font-normal text-[12px]"> active</span>
                    </p>
                  </div>
                </div>
              </section>

              {client.notes && (
                <>
                  <hr className="border-slate-200 dark:border-white/[0.05]" />
                  <section>
                    <div className="flex items-center gap-1.5 mb-3">
                      <FileText size={12} className="text-slate-600" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Notes</span>
                    </div>
                    <p className="text-[12px] text-slate-400 leading-relaxed">{client.notes}</p>
                  </section>
                </>
              )}

              <hr className="border-slate-200 dark:border-white/[0.05]" />

              {/* ── Contacts ── */}
              <section>
                <div className="flex items-center gap-1.5 mb-3">
                  <Phone size={12} className="text-slate-600" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Contacts</span>
                </div>
                <div className="space-y-2.5">
                  {client.phone && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[12px] text-slate-600 flex-shrink-0">Phone</span>
                      <span className="text-[12px] text-slate-700 dark:text-slate-300 text-right">{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[12px] text-slate-600 flex-shrink-0">E-mail</span>
                      <span className="text-[12px] text-slate-700 dark:text-slate-300 text-right truncate">{client.email}</span>
                    </div>
                  )}
                </div>
              </section>

            </div>
          </aside>

          {/* ══════════ RIGHT PANEL ══════════ */}
          <main className="flex-1 flex flex-col overflow-hidden">

            {/* Tab navigation */}
            <div className="flex items-center border-b border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#141414] px-2 sm:px-5 overflow-x-auto flex-shrink-0 scrollbar-hide">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-2.5 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-[12px] font-semibold whitespace-nowrap border-b-2 transition-all -mb-px ${
                    tab === key
                      ? 'border-[#f97316] text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-400 hover:border-slate-300 dark:hover:border-white/[0.15]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">

              {/* ─── Calendar tab ─────────────────────────────── */}
              {tab === 'calendar' && (
                <div className="space-y-6">

                  {/* Calendar header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <button onClick={prevMonth}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors">
                        <ChevronLeft size={14} />
                      </button>
                      <h2 className="text-[17px] sm:text-[20px] font-semibold text-slate-900 dark:text-white tracking-tight min-w-[180px] sm:min-w-[200px] text-center">
                        {MONTHS[calendarDate.getMonth()]}, {calendarDate.getFullYear()}
                      </h2>
                      <button onClick={nextMonth}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors">
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* View toggle */}
                      <div className="flex bg-slate-100 dark:bg-[#131820] rounded-xl border border-slate-200 dark:border-white/[0.06] p-0.5">
                        {['Week', 'Month', 'Year'].map((v, i) => (
                          <button key={v} className={`px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-[12px] font-medium rounded-lg transition-colors ${
                            i === 1 ? 'bg-cyan-950 text-white' : 'text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}>
                            {v}
                          </button>
                        ))}
                      </div>
                      <button onClick={goToToday}
                        className="px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-[12px] font-medium text-slate-500 border border-slate-200 dark:border-white/[0.08] rounded-xl hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/[0.18] transition-colors">
                        Today
                      </button>
                      <button
                        onClick={() => openScheduleModal(new Date())}
                        className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-white text-[11px] sm:text-[12px] font-semibold rounded-xl transition-colors">
                        <Plus size={13} /> <span className="hidden xs:inline">New Event</span><span className="xs:hidden">New</span>
                      </button>
                    </div>
                  </div>

                  {/* Calendar grid */}
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-transparent overflow-x-auto">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 min-w-[500px]">
                      {DAYS.map(d => (
                        <div key={d} className="py-2 sm:py-2.5 border-b border-slate-200 dark:border-white/[0.06] bg-slate-100 dark:bg-[#171717] text-center text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {d}
                        </div>
                      ))}
                    </div>
                    {/* Weeks */}
                    {calendarWeeks.map((week, wi) => (
                      <div key={wi} className="grid grid-cols-7 min-w-[500px]">
                        {week.map((day, di) => (
                          <div
                            key={`${wi}-${di}`}
                            onClick={() => day.currentMonth && day.fullDate && openScheduleModal(day.fullDate)}
                            className={[
                              'group relative min-h-[60px] sm:min-h-[88px] border-b border-r border-slate-200 dark:border-white/[0.05] p-1 sm:p-1.5',
                              day.currentMonth ? 'cursor-pointer' : 'cursor-default',
                              day.isToday ? 'ring-1 ring-inset ring-[#2563eb]/50 bg-blue-50 dark:bg-[#0d1a2e]' : '',
                              day.isWeekend && day.currentMonth ? 'bg-slate-50 dark:bg-[#0a0d15]' : '',
                              !day.currentMonth ? 'opacity-20' : '',
                              day.currentMonth && !day.isToday ? 'hover:bg-slate-50 dark:hover:bg-white/[0.03]' : '',
                            ].filter(Boolean).join(' ')}
                          >
                            <div className={`text-[10px] sm:text-[11px] mb-1 text-right pr-0.5 font-medium ${
                              day.isToday ? 'text-[#2563eb]' : day.currentMonth ? 'text-slate-500' : 'text-slate-300 dark:text-slate-700'
                            }`}>
                              {day.date}
                            </div>
                            {day.events.slice(0, 2).map(ev =>
                              ev.type === 'workout' && ev.planId ? (
                                <Link key={ev.id} href={`/workout-plans/${ev.planId}`}
                                  className="flex items-center gap-1 mb-0.5 group" title={ev.details}>
                                  <div className="w-[3px] h-3 rounded-full flex-shrink-0" style={{ background: ev.color }} />
                                  <span className="text-[9px] sm:text-[10px] text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 truncate transition-colors">{ev.title}</span>
                                </Link>
                              ) : (
                                <div key={ev.id} className="flex items-center gap-1 mb-0.5" title={ev.details}>
                                  <div className="w-[3px] h-3 rounded-full flex-shrink-0" style={{ background: ev.color }} />
                                  <span className="text-[9px] sm:text-[10px] text-slate-500 truncate">{ev.title}</span>
                                </div>
                              )
                            )}
                            {day.events.length > 2 && (
                              <div className="flex items-center gap-1">
                                <div className="w-[3px] h-3 rounded-full bg-slate-400 dark:bg-slate-700" />
                                <span className="text-[10px] text-slate-500 dark:text-slate-700">+{day.events.length - 2}</span>
                              </div>
                            )}
                            {/* + icon on hover for schedule */}
                            {day.currentMonth && (
                              <div
                                onClick={e => { e.stopPropagation(); day.fullDate && openScheduleModal(day.fullDate) }}
                                className="absolute bottom-1 right-1 w-5 h-5 rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171717] flex items-center justify-center text-slate-500 dark:text-slate-700 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/[0.25] hover:bg-slate-100 dark:hover:bg-[#1a2a4a] transition-colors opacity-0 group-hover:opacity-100">
                                <Plus size={10} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* ── Notes / Messages ── */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <MessageCircle size={15} className="text-slate-500" />
                      <span className="text-[14px] font-semibold text-slate-900 dark:text-white">Notes</span>
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-[10px] font-medium text-slate-500">
                        {messagesData?.data?.length ?? 0}
                      </span>
                    </div>

                    {/* Composer */}
                    <div className="rounded-xl border border-slate-200 dark:border-white/[0.07] overflow-hidden mb-5 bg-white dark:bg-transparent">
                      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5">
                        <div className="w-8 h-8 rounded-full bg-[#f97316] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          C
                        </div>
                        <input
                          value={msg}
                          onChange={e => setMsg(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                          placeholder="Type your comment here or @ to mention and notify someone"
                          className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#171717]">
                        <div className="flex items-center gap-0.5">
                          {['B', 'I', 'U'].map(t => (
                            <button key={t} className="w-7 h-7 rounded-md text-[12px] font-semibold text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors">{t}</button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setMsg('')}
                            className="px-3.5 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.07] rounded-lg transition-colors">
                            Cancel
                          </button>
                          <button onClick={handleSend} disabled={sendMsg.isPending || !msg.trim()}
                            className="px-3.5 py-1.5 text-[12px] font-semibold text-white bg-cyan-950 hover:bg-cyan-900 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            Save
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Message list */}
                    <div className="space-y-5">
                      {allMessages.map((m: any) => (
                        <div key={m.id} className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                            m.sender_role === 'coach' ? 'bg-[#f97316]' : 'bg-cyan-950'
                          } text-white`}>
                            {m.sender_role === 'coach' ? 'C' : client.name[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                {m.sender_role === 'coach' ? 'You (Coach)' : client.name}
                              </span>
                              <span className="text-[11px] text-slate-700">{timeAgo(m.sent_at)}</span>
                            </div>
                            <p className="text-[13px] text-slate-400 leading-relaxed">{m.content}</p>
                          </div>
                        </div>
                      ))}
                      {allMessages.length === 0 && (
                        <p className="text-center text-[12px] text-slate-700 py-4">No notes yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Workouts tab ─────────────────────────────── */}
              {tab === 'workouts' && (
                <div className="space-y-5">
                  {/* ── Header ── */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">Workout Plans</h3>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{(plans?.data ?? []).length} plans assigned to this client</p>
                    </div>
                    <Link href={`/workout-plans/new?client=${id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold bg-cyan-950 hover:bg-cyan-900 text-white transition-colors self-start sm:self-auto shadow-sm">
                      <Plus size={14} /> New Plan
                    </Link>
                  </div>

                  {/* ── Empty state ── */}
                  {(plans?.data ?? []).length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/[0.08] bg-white dark:bg-transparent p-12 text-center">
                      <Dumbbell className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mb-1">No workout plans yet</p>
                      <p className="text-[12px] text-slate-400 dark:text-slate-500 mb-5">Create a new plan to get started</p>
                      <Link href={`/workout-plans/new?client=${id}`}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[12px] font-semibold bg-cyan-950 hover:bg-cyan-900 text-white transition-colors shadow-sm">
                        <Plus size={14} /> Create First Plan
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(plans?.data ?? []).map(plan => {
                        const allExercises = plan.days?.flatMap(d => d.exercises ?? []) ?? []
                        const planCategory = getWorkoutCategory(allExercises)
                        const catCfg = CATEGORY_CONFIG[planCategory]
                        const isExpanded = expandedPlan === plan.id
                        const totalExercises = allExercises.length
                        const completedDays = plan.days?.filter(d => completedDaysMap[`${plan.id}-${d.day.toLowerCase()}`]).length ?? 0
                        const totalDays = plan.days?.length ?? 0

                        return (
                          <div
                            key={plan.id}
                            className={`rounded-2xl border transition-all overflow-hidden ${
                              isExpanded
                                ? 'border-blue-300 dark:border-blue-700/50 shadow-md bg-white dark:bg-[#171717]'
                                : 'border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] hover:shadow-sm'
                            }`}
                          >
                            {/* ── Card header row ── */}
                            <div className="flex flex-col gap-3 p-4 sm:p-5 bg-white dark:bg-[#171717]">
                              <div className="flex items-start gap-3 sm:gap-4">
                                {/* Category icon */}
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                                  style={{ background: catCfg.bg }}>
                                  {catCfg.icon}
                                </div>

                                {/* Title + description */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-[14px] font-semibold text-slate-900 dark:text-white leading-snug">{plan.title}</p>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                                      style={{ color: catCfg.color, background: catCfg.bg }}>
                                      {catCfg.label}
                                    </span>
                                  </div>
                                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                    Week of {formatDate(plan.week_start, 'MMM d, yyyy')} · {totalDays} days · {totalExercises} exercises
                                    {completedDays > 0 && ` · ${completedDays}/${totalDays} completed`}
                                  </p>
                                </div>

                                {/* Right side: badges + actions */}
                                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                                  {/* Status badge */}
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    plan.status === 'active'
                                      ? 'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                                      : plan.status === 'completed'
                                        ? 'bg-blue-100 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400'
                                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      plan.status === 'active' ? 'bg-emerald-500' : plan.status === 'completed' ? 'bg-blue-500' : 'bg-slate-400'
                                    }`} />
                                    {plan.status}
                                  </span>

                                  {/* View Details toggle */}
                                  <button
                                    onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                                    className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">
                                    View Details
                                    <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>

                                  {/* More actions */}
                                  <button
                                    onClick={() => handleDeleteWorkout(plan)}
                                    disabled={deleteWorkoutPlan.isPending}
                                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50">
                                    {deleteWorkoutPlan.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                  </button>
                                </div>
                              </div>

                              {/* Mobile View Details */}
                              <button
                                onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                                className="sm:hidden flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                {isExpanded ? 'Hide Details' : 'View Details'}
                                <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            </div>

                            {/* ── Expanded details ── */}
                            {isExpanded && (
                              <div className="border-t border-slate-100 dark:border-white/[0.06]">
                                {/* Quick info bar */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 sm:p-5 bg-white dark:bg-[#171717]">
                                  <div>
                                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Week</p>
                                    <p className="text-[13px] font-medium text-slate-800 dark:text-white mt-0.5">{formatDate(plan.week_start, 'MMM d, yyyy')}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Days</p>
                                    <p className="text-[13px] font-medium text-slate-800 dark:text-white mt-0.5">{totalDays} training days</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Exercises</p>
                                    <p className="text-[13px] font-medium text-slate-800 dark:text-white mt-0.5">{totalExercises} total</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Progress</p>
                                    <p className="text-[13px] font-medium text-slate-800 dark:text-white mt-0.5">{completedDays}/{totalDays} completed</p>
                                  </div>
                                </div>

                                {plan.notes && (
                                  <div className="mx-4 sm:mx-5 mb-4 rounded-xl p-3 bg-amber-50 dark:bg-amber-900/10">
                                    <p className="text-[12px] text-amber-800 dark:text-amber-200">{plan.notes}</p>
                                  </div>
                                )}

                                {/* Days */}
                                {plan.days?.length ? (
                                  <div className="divide-y divide-slate-100 dark:divide-white/[0.04] bg-[#171717]">
                                    {plan.days.map((day, idx) => {
                                      const dayCategory  = getWorkoutCategory(day.exercises ?? [])
                                      const dayCfg       = CATEGORY_CONFIG[dayCategory]
                                      const isCompleted  = completedDaysMap[`${plan.id}-${day.day.toLowerCase()}`] ?? false
                                      return (
                                        <div key={idx} className="p-4 sm:px-5">
                                          <div className="flex items-center gap-3 mb-3">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                              style={{ background: dayCfg.bg }}>
                                              {dayCfg.icon}
                                            </div>
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <p className="text-[13px] font-medium text-slate-900 dark:text-white">{day.day}</p>
                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                                                  style={{ color: dayCfg.color, background: dayCfg.bg }}>
                                                  {dayCfg.label}
                                                </span>
                                                {isCompleted && (
                                                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                                                    <CheckCircle2 size={9} /> Completed
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{day.exercises?.length ?? 0} exercises</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                              isCompleted ? 'border-emerald-400 bg-emerald-400/10' : 'border-slate-200 dark:border-white/10'
                                            }`}>
                                              {isCompleted && <Check size={10} className="text-emerald-400" />}
                                            </div>
                                          </div>
                                          {day.exercises?.length ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-12">
                                              {day.exercises.map((ex, ei) => (
                                                <div key={ei} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]">
                                                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dayCfg.color }} />
                                                  <div className="min-w-0 flex-1">
                                                    <p className="text-[12px] text-slate-700 dark:text-slate-300 truncate">{ex.name}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{ex.sets}×{ex.reps}{ex.rest_seconds ? ` · ${ex.rest_seconds}s` : ''}</p>
                                                  </div>
                                                  {ex.demo_video_url && (
                                                    <a href={ex.demo_video_url} target="_blank" rel="noopener noreferrer"
                                                      className="flex-shrink-0 text-blue-500 hover:text-blue-300 transition-colors">
                                                      <Video size={11} />
                                                    </a>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          ) : null}
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div className="p-6 text-center bg-white dark:bg-[#171717]">
                                    <p className="text-[12px] text-slate-500 dark:text-slate-400">No workout days defined</p>
                                  </div>
                                )}

                                {/* Edit link */}
                                <div className="border-t border-slate-100 dark:border-white/[0.06] p-4 sm:px-5 flex items-center justify-end gap-2 bg-white dark:bg-[#171717]">
                                  <Link href={`/workout-plans/${plan.id}`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/15 hover:bg-blue-100 dark:hover:bg-blue-900/25 transition-colors">
                                    <ExternalLink size={12} /> Open Plan
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* ── Workout History (completed logs) — planned vs actual + media ── */}
                  <div className="mt-8">
                    <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-4">Workout History</h3>
                    {(workoutLogs ?? []).length === 0 ? (
                      <div className=" dark:bg-transparent p-8 text-center">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                        <p className="text-[13px] text-slate-500">No workouts logged yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(workoutLogs ?? []).map((log: any) => {
                          const isExpanded = expandedLog === log.id
                          const totalSets = (log.exercises ?? []).reduce((acc: number, ex: any) => acc + (ex.sets_completed?.length ?? 0), 0)
                          const totalVolume = (log.exercises ?? []).reduce((acc: number, ex: any) =>
                            acc + (ex.sets_completed ?? []).reduce((s: number, set: any) => s + (set.kg ?? 0) * (set.reps_done ?? set.reps ?? 0), 0), 0)
                          const logMedia = log.media ?? []
                          const plannedExercises = log.planned_exercises ?? []
                          return (
                            <div key={log.id} className={`rounded-2xl border overflow-hidden transition-all ${
                              isExpanded
                                ? 'border-blue-300 dark:border-blue-700/50 shadow-md bg-white dark:bg-[#171717]'
                                : 'border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] hover:shadow-sm'
                            }`}>
                              <button onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-left">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle2 size={16} className="text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                                    {log.plan_title ?? 'Workout'} — {log.day}
                                  </p>
                                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                    <span className="text-[11px] text-slate-500">{log.exercises?.length ?? 0} exercises</span>
                                    <span className="text-[11px] text-slate-500">{totalSets} sets</span>
                                    {totalVolume > 0 && <span className="text-[11px] text-slate-500">{Math.round(totalVolume).toLocaleString()} kg vol</span>}
                                    {logMedia.length > 0 && (
                                      <span className="text-[11px] text-blue-400 flex items-center gap-0.5">
                                        <ImageIcon size={10} /> {logMedia.length} media
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[11px] text-slate-500 flex-shrink-0">{log.completed_at ? timeAgo(log.completed_at) : ''}</span>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              {isExpanded && (
                                <div className="border-t border-slate-100 dark:border-white/[0.06]">
                                  {/* ── Planned vs Actual comparison ── */}
                                  <div className="p-4 space-y-4">
                                    {(log.exercises ?? []).map((ex: any, ei: number) => {
                                      const planned = plannedExercises.find((pe: any) => pe.name === ex.name)
                                      return (
                                        <div key={ei} className="rounded-xl border border-slate-100 dark:border-white/[0.05] bg-slate-50 dark:bg-[#141414] overflow-hidden">
                                          {/* Exercise header */}
                                          <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-white/[0.04]">
                                            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/25 flex items-center justify-center flex-shrink-0">
                                              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">{ei + 1}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{ex.name}</p>
                                              {planned && (
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                  Planned: {planned.sets}×{planned.reps}{planned.rest_seconds ? ` · ${planned.rest_seconds}s rest` : ''}
                                                </p>
                                              )}
                                            </div>
                                            {planned?.demo_video_url && (
                                              <a href={planned.demo_video_url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 font-medium">
                                                <Play size={10} /> Demo
                                              </a>
                                            )}
                                          </div>

                                          {/* Sets table with planned vs actual */}
                                          <div className="p-3">
                                            <div className={`grid gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 px-1 ${
                                              planned ? 'grid-cols-5' : 'grid-cols-3'
                                            }`}>
                                              <span>Set</span>
                                              {planned && <><span className="text-slate-400">Plan kg</span><span className="text-slate-400">Plan reps</span></>}
                                              <span className="text-blue-500">Actual kg</span>
                                              <span className="text-blue-500">Actual reps</span>
                                            </div>
                                            {(ex.sets_completed ?? []).map((set: any, si: number) => {
                                              const plannedSets = planned ? planned.sets : 0
                                              return (
                                                <div key={si} className={`grid gap-1 text-[12px] px-1 py-1.5 rounded-lg ${si % 2 === 0 ? 'bg-white dark:bg-white/[0.02]' : ''} ${
                                                  planned ? 'grid-cols-5' : 'grid-cols-3'
                                                }`}>
                                                  <span className="text-slate-500 font-medium">{set.set_number}</span>
                                                  {planned && (
                                                    <>
                                                      <span className="text-slate-400">—</span>
                                                      <span className="text-slate-400">{planned.reps}</span>
                                                    </>
                                                  )}
                                                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{set.kg ?? 0}</span>
                                                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{set.reps_done ?? set.reps ?? 0}</span>
                                                </div>
                                              )
                                            })}
                                          </div>

                                          {/* Coach notes for this exercise */}
                                          {planned?.notes && (
                                            <div className="px-3 pb-3">
                                              <p className="text-[10px] text-slate-400 font-medium">Coach note:</p>
                                              <p className="text-[11px] text-slate-500 italic">{planned.notes}</p>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}

                                    {/* Client notes */}
                                    {log.notes && (
                                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/20">
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mb-1">Client Notes</p>
                                        <p className="text-[12px] text-amber-800 dark:text-amber-300">{log.notes}</p>
                                      </div>
                                    )}

                                    {/* ── Media gallery (photos/videos from this log) ── */}
                                    {logMedia.length > 0 && (
                                      <div>
                                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Media Uploads</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                          {logMedia.map((m: any) => (
                                            <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
                                              className="group relative aspect-square rounded-xl bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center overflow-hidden hover:border-blue-300 dark:hover:border-blue-700/50 transition-colors">
                                              {m.type === 'video' ? (
                                                <>
                                                  <Video className="w-6 h-6 text-slate-400" />
                                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Play size={18} className="text-white" />
                                                  </div>
                                                </>
                                              ) : m.url ? (
                                                <img src={m.url} alt="" className="w-full h-full object-cover" />
                                              ) : (
                                                <ImageIcon className="w-6 h-6 text-slate-400" />
                                              )}
                                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] text-white/80 capitalize">{m.type}</span>
                                              </div>
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Nutrition tab ──────────────────────────────── */}
              {tab === 'nutrition' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Nutrition Plans</h3>
                    <Link href={`/nutrition-plans/new?client=${id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-cyan-950 text-white transition-colors">
                      <Plus size={13} /> New Plan
                    </Link>
                  </div>
                  {(nutrition ?? []).length === 0 ? (
                    <div className="rounded-xl  dark:bg-transparent p-12 text-center">
                      <Salad className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                      <p className="text-[13px] text-slate-500">No nutrition plans yet</p>
                    </div>
                  ) : (nutrition ?? []).map(plan => (
                    <NutritionListCard
                      key={plan.id}
                      plan={plan}
                      expanded={expandedPlan === plan.id}
                      onToggle={() => setExpandedPlan(prev => prev === plan.id ? null : plan.id)}
                    />
                  ))}
                </div>
              )}

              {/* ─── Analytics tab ──────────────────────────────── */}
              {tab === 'analytics' && (
                <div className="space-y-5">
                  <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Real-Time Progress & Analytics</h3>

                  {/* ── Summary cards ── */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-4">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Streak</p>
                      <p className="text-3xl font-semibold text-orange-500">{analytics?.current_streak ?? 0}<span className="text-[12px] font-normal text-slate-500 ml-1">days</span></p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-4">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Workouts</p>
                      <p className="text-3xl font-semibold text-blue-500">{analytics?.total_workouts ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-4">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Total Volume</p>
                      <p className="text-3xl font-semibold text-purple-500">{((analytics?.total_volume ?? 0) / 1000).toFixed(1)}<span className="text-[12px] font-normal text-slate-500 ml-1">t</span></p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-4">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Total Sets</p>
                      <p className="text-3xl font-semibold text-emerald-500">{analytics?.total_sets ?? 0}</p>
                    </div>
                  </div>

                  {/* ── Weekly completion chart ── */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-5">
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Weekly Completion Rate</p>
                    {(Array.isArray(analytics?.completion_rate) ? analytics.completion_rate : []).length === 0 ? (
                      <p className="text-[13px] text-slate-500 py-4 text-center">No completion data yet</p>
                    ) : (
                      <div className="flex items-end gap-2 h-32">
                        {(Array.isArray(analytics?.completion_rate) ? analytics.completion_rate : []).slice(-12).reverse().map((w: any, i: number) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{w.rate}%</span>
                            <div className="w-full rounded-t-lg transition-all" style={{
                              height: `${Math.max(w.rate, 4)}%`,
                              background: w.rate >= 80 ? '#10b981' : w.rate >= 50 ? '#f59e0b' : '#ef4444',
                            }} />
                            <span className="text-[9px] text-slate-400 truncate w-full text-center">{w.week?.slice(5)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Weekly volume trend ── */}
                  {(Array.isArray(analytics?.weekly_volume) ? analytics.weekly_volume : []).length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-5">
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Weekly Volume Trend</p>
                      <div className="flex items-end gap-2 h-28">
                        {(Array.isArray(analytics?.weekly_volume) ? analytics.weekly_volume : []).map((w: any, i: number) => {
                          const maxVol = Math.max(...(Array.isArray(analytics?.weekly_volume) ? analytics.weekly_volume : []).map((v: any) => v.volume))
                          const pct = maxVol > 0 ? (w.volume / maxVol) * 100 : 0
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-[9px] font-semibold text-slate-500">{(w.volume / 1000).toFixed(1)}t</span>
                              <div className="w-full bg-blue-500 rounded-t-lg transition-all" style={{ height: `${Math.max(pct, 4)}%` }} />
                              <span className="text-[9px] text-slate-400">{w.sessions}s</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Personal Records ── */}
                  {(Array.isArray(analytics?.personal_records) ? analytics.personal_records : []).length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-5">
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Personal Records</p>
                      <div className="space-y-2">
                        {(Array.isArray(analytics?.personal_records) ? analytics.personal_records : []).map((pr: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/25 flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-semibold text-amber-600">#{i + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-slate-800 dark:text-slate-200 truncate">{pr.exercise}</p>
                              {pr.date && <p className="text-[10px] text-slate-400">{pr.date}</p>}
                            </div>
                            <span className="text-[14px] font-semibold text-slate-900 dark:text-white">{pr.max_kg} <span className="text-[10px] font-normal text-slate-500">kg</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Exercise Progress (top 5) ── */}
                  {Object.keys(analytics?.exercise_progress ?? {}).length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-5">
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Exercise Progress (Max Weight Over Time)</p>
                      <div className="space-y-4">
                        {Object.entries(analytics?.exercise_progress ?? {}).slice(0, 5).map(([name, data]: [string, any]) => {
                          const points = Array.isArray(data) ? data : []
                          const max = Math.max(...points.map((p: any) => p.max_kg))
                          const min = Math.min(...points.map((p: any) => p.max_kg))
                          return (
                            <div key={name}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">{name}</p>
                                <span className="text-[11px] text-slate-500">{min}–{max} kg</span>
                              </div>
                              <div className="flex items-end gap-0.5 h-10">
                                {points.slice(-20).map((p: any, i: number) => {
                                  const range = max - min || 1
                                  const pct = ((p.max_kg - min) / range) * 80 + 20
                                  return (
                                    <div key={i} className="flex-1 bg-blue-400 dark:bg-blue-500 rounded-t transition-all" style={{ height: `${pct}%` }}
                                      title={`${p.date}: ${p.max_kg}kg`} />
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Body Measurements ── */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-5">
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Body Measurements</p>
                    {(Array.isArray(analytics?.measurements) ? analytics.measurements : []).length === 0 ? (
                      <p className="text-[13px] text-slate-500 py-4 text-center">No measurements recorded yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              <th className="pb-2 pr-4">Date</th>
                              <th className="pb-2 pr-4">Weight</th>
                              <th className="pb-2 pr-4">Chest</th>
                              <th className="pb-2 pr-4">Waist</th>
                              <th className="pb-2 pr-4">Hips</th>
                              <th className="pb-2">Body Fat</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                            {(Array.isArray(analytics?.measurements) ? analytics.measurements : []).slice(-10).reverse().map((m: any, i: number) => (
                              <tr key={i}>
                                <td className="py-2 pr-4 text-slate-500">{m.date ?? '—'}</td>
                                <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-200">{m.weight_kg ? `${m.weight_kg} kg` : '—'}</td>
                                <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{m.chest_cm ? `${m.chest_cm} cm` : '—'}</td>
                                <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{m.waist_cm ? `${m.waist_cm} cm` : '—'}</td>
                                <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{m.hips_cm ? `${m.hips_cm} cm` : '—'}</td>
                                <td className="py-2 text-slate-600 dark:text-slate-300">{m.body_fat_pct ? `${m.body_fat_pct}%` : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* ── Progress Photos ── */}
                  {(Array.isArray(analytics?.photos) ? analytics.photos : []).length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] p-5">
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Progress Photos</p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {(Array.isArray(analytics?.photos) ? analytics.photos : []).map((p: any) => (
                          <div key={p.id} className="aspect-square rounded-xl bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06] overflow-hidden">
                            {p.url ? (
                              <img src={p.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon size={20} className="text-slate-400" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Messages tab ───────────────────────────────── */}
              {tab === 'messages' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Client avatar + name in header */}
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {client.profile_photo_url
                          ? <img src={client.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-xs font-semibold text-slate-900 dark:text-white">{client.name[0].toUpperCase()}</span>}
                      </div>
                      <div>
                        <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">{client.name}</h3>
                        <span className={`text-[11px] ${client.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {client.active ? 'Active' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {socketConnected
                        ? <><Wifi size={11} className="text-emerald-400" /><span className="text-emerald-400">Live</span></>
                        : <><WifiOff size={11} className="text-slate-600" /><span className="text-slate-600">Polling</span></>}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-[#141414]">
                      {msgLoading && allMessages.length === 0 && (
                        <p className="text-center text-slate-600 text-[13px] mt-8">Loading messages…</p>
                      )}
                      {allMessages.map((m: any) => (
                        <div key={m.id} className={`flex ${m.sender_role === 'coach' ? 'justify-end' : 'justify-start'}`}>
                          {m.sender_role === 'client' && (
                            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-[#1a1f2e] flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                              {client.profile_photo_url
                                ? <img src={client.profile_photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                                : <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{client.name[0].toUpperCase()}</span>}
                            </div>
                          )}
                          <div className={`max-w-[85%] sm:max-w-xs px-4 py-2.5 rounded-2xl text-[13px] ${
                            m.sender_role === 'coach' ? 'bg-cyan-950 text-white' : 'bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/[0.07] text-slate-700 dark:text-slate-300'
                          }`}>
                            {/* Media attachment */}
                            {m.media_url && m.media_type === 'image' && (
                              <a href={m.media_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                                <img src={m.media_url} alt="" className="rounded-lg max-w-full max-h-48 object-cover" />
                              </a>
                            )}
                            {m.media_url && m.media_type === 'file' && (
                              <a href={m.media_url} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-lg ${
                                  m.sender_role === 'coach' ? 'bg-blue-700/40' : 'bg-slate-100 dark:bg-white/[0.05]'
                                }`}>
                                <FileText size={14} />
                                <span className="text-[12px] truncate flex-1">{m.media_filename || 'File'}</span>
                                <Download size={12} />
                              </a>
                            )}
                            {m.content && <p>{m.content}</p>}
                            <p className={`text-[11px] mt-1 ${m.sender_role === 'coach' ? 'text-blue-200' : 'text-slate-600'}`}>{timeAgo(m.sent_at)}</p>
                          </div>
                        </div>
                      ))}
                      {!msgLoading && allMessages.length === 0 && (
                        <p className="text-center text-slate-600 text-[13px] mt-8">No messages yet</p>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    {/* Pending file preview */}
                    {pendingFile && (
                      <div className="px-4 py-2 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0a0e16] flex items-center gap-2">
                        {pendingFile.media_type === 'image'
                          ? <img src={pendingFile.media_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          : <FileText size={16} className="text-slate-500" />}
                        <span className="text-[12px] text-slate-600 dark:text-slate-400 truncate flex-1">{pendingFile.media_filename}</span>
                        <button onClick={() => setPendingFile(null)} className="text-slate-400 hover:text-red-400">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <div className="p-4 border-t border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#171717] flex gap-2">
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden"
                        accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadMedia.isPending}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.07] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors disabled:opacity-40">
                        {uploadMedia.isPending ? <Loader2 size={15} className="animate-spin" /> : <Paperclip size={15} />}
                      </button>
                      <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
                        className="flex-1 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.07] rounded-xl px-4 py-2 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none focus:border-slate-300 dark:focus:border-white/[0.15]"
                        placeholder="Type a message…" />
                      <button onClick={handleSend} disabled={sendMsg.isPending || (!msg.trim() && !pendingFile)}
                        className="px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <Send size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Schedule tab ──────────────────────────────── */}
              {tab === 'checkins' && (() => {
                const filterTabs = ['Upcoming', 'Ongoing', 'Rescheduled', 'Cancelled'] as const
                type ScheduleFilter = typeof filterTabs[number]
                const getStatusFilter = (f: ScheduleFilter) => {
                  if (f === 'Upcoming')     return (c: CheckinMeeting) => c.status === 'scheduled' && c.client_response !== 'reschedule_requested'
                  if (f === 'Ongoing')      return (c: CheckinMeeting) => c.status === 'completed'
                  if (f === 'Rescheduled')  return (c: CheckinMeeting) => c.client_response === 'reschedule_requested'
                  return (c: CheckinMeeting) => c.status === 'cancelled'
                }

                const allCheckins = checkins ?? []
                const activeFilter = (typeof window !== 'undefined' && (window as any).__schedFilter) || 'Upcoming'
                const setActiveFilter = (f: ScheduleFilter) => { (window as any).__schedFilter = f; setActiveChatId(prev => prev) }
                const filtered = allCheckins.filter(getStatusFilter(activeFilter as ScheduleFilter))

                // Group by date
                const grouped = filtered.reduce<Record<string, CheckinMeeting[]>>((acc, c) => {
                  const d = new Date(c.scheduled_at)
                  const key = d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  const today = new Date()
                  const isToday = d.toDateString() === today.toDateString()
                  const label = isToday ? `Today, ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}` : key
                  if (!acc[label]) acc[label] = []
                  acc[label].push(c)
                  return acc
                }, {})
                const sortedGroups = Object.entries(grouped).sort(([, a], [, b]) =>
                  new Date(a[0].scheduled_at).getTime() - new Date(b[0].scheduled_at).getTime()
                )

                return (
                <div className="space-y-5">
                  {/* ── Header ── */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">Schedule</h3>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Manage all sessions and meetings for this client</p>
                    </div>
                    <button
                      onClick={() => openScheduleModal(new Date())}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold bg-cyan-950 cursor-pointer hover:bg-cyan-900 text-white transition-colors self-start sm:self-auto shadow-sm">
                      <Plus size={14} /> Create Appointment
                    </button>
                  </div>

                  {/* ── Filter tabs + actions ── */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-0.5 overflow-x-auto pb-1 sm:pb-0">
                      {filterTabs.map(f => (
                        <button
                          key={f}
                          onClick={() => setActiveFilter(f)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
                            activeFilter === f
                              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-semibold'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                          }`}
                        >{f}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {socketConnected
                          ? <><Wifi size={10} className="text-emerald-400" /><span className="text-emerald-400">Live</span></>
                          : <><WifiOff size={10} className="text-slate-500" /><span>Offline</span></>}
                      </div>
                    </div>
                  </div>

                  {/* ── Empty state ── */}
                  {filtered.length === 0 ? (
                    <div className="mt-[12rem]  dark:border-white/[0.08] p-12 text-center">
                      <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mb-1">No {(activeFilter as string).toLowerCase()} meetings</p>
                      <p className="text-[12px] text-slate-400 dark:text-slate-500 mb-5">Schedule a new meeting to get started</p>
                      <button
                        onClick={() => openScheduleModal(new Date())}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[12px] font-semibold bg-cyan-950 hover:bg-cyan-900 text-white transition-colors shadow-sm">
                        <Plus size={14} /> Schedule First Meeting
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {sortedGroups.map(([dateLabel, events]) => (
                        <div key={dateLabel}>
                          {/* ── Date group header ── */}
                          <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mb-3 pl-1">{dateLabel}</p>

                          <div className="space-y-3">
                            {events.map(c => {
                              const isExpanded = activeChatId === c.id
                              const statusColor = c.status === 'completed'
                                ? 'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                                : c.status === 'cancelled'
                                  ? 'bg-red-100 dark:bg-red-900/25 text-red-700 dark:text-red-400'
                                  : c.client_response === 'reschedule_requested'
                                    ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400'
                                    : 'bg-blue-100 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400'
                              const statusLabel = c.status === 'completed' ? 'Completed'
                                : c.status === 'cancelled' ? 'Cancelled'
                                  : c.client_response === 'reschedule_requested' ? 'Rescheduled'
                                    : c.client_response === 'accepted' ? 'Confirmed'
                                      : c.client_response === 'declined' ? 'Declined'
                                        : 'Upcoming'
                              const typeLabel = c.type === 'video' ? 'Video Call' : c.type === 'call' ? 'Phone Call' : 'Chat Session'
                              const time = new Date(c.scheduled_at)
                              const endTime = new Date(time.getTime() + 60 * 60 * 1000) // default 1h duration

                              return (
                                <div
                                  key={c.id}
                                  className={` border transition-all overflow-hidden ${
                                    isExpanded
                                      ? 'border-blue-300 dark:border-blue-700/50 shadow-md bg-white dark:bg-[#171717]'
                                      : 'border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171717] hover:shadow-sm'
                                  }`}
                                >
                                  {/* ── Card header row ── */}
                                  <div className="flex flex-col gap-3 p-4 sm:p-5 bg-white dark:bg-[#171717]">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                      {/* Type icon */}
                                      <div className={`w-10 h-10  flex items-center justify-center flex-shrink-0 ${
                                        c.type === 'video' ? 'bg-blue-100 dark:bg-blue-900/25'
                                        : c.type === 'call' ? 'bg-emerald-100 dark:bg-emerald-900/25'
                                        : 'bg-purple-100 dark:bg-purple-900/25'
                                      }`}>
                                        {c.type === 'video' ? <Video size={16} className="text-blue-600 dark:text-blue-400" />
                                          : c.type === 'call' ? <PhoneCall size={16} className="text-emerald-600 dark:text-emerald-400" />
                                          : <Hash size={16} className="text-purple-600 dark:text-purple-400" />}
                                      </div>

                                      {/* Title + description */}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-semibold text-slate-900 dark:text-white leading-snug">{typeLabel}</p>
                                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                          {c.notes || `Session with ${client?.name ?? 'client'}`}
                                        </p>
                                      </div>

                                      {/* Right side: badges + actions */}
                                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                                        {/* Status badge */}
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${
                                            c.status === 'completed' ? 'bg-emerald-500' : c.status === 'cancelled' ? 'bg-red-500'
                                            : c.client_response === 'reschedule_requested' ? 'bg-amber-500' : 'bg-blue-500'
                                          }`} />
                                          {statusLabel}
                                        </span>

                                        {/* View Details toggle */}
                                        <button
                                          onClick={() => setActiveChatId(isExpanded ? null : c.id)}
                                          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">
                                          View Details
                                          <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* More menu dot */}
                                        <button className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">
                                          <MoreVertical size={14} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Mobile View Details */}
                                    <button
                                      onClick={() => setActiveChatId(isExpanded ? null : c.id)}
                                      className="sm:hidden flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                      {isExpanded ? 'Hide Details' : 'View Details'}
                                      <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                  </div>

                                  {/* ── Expanded details ── */}
                                  {isExpanded && (
                                    <div className="border-t border-slate-100 dark:border-white/[0.06]">
                                      {/* Detail grid */}
                                      <div className="grid bg-white dark:bg-[#171717] grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-5">
                                        {/* Start / End */}
                                        <div className="space-y-3">
                                          <div className="flex gap-6">
                                            <div>
                                              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Start</p>
                                              <p className="text-[13px] font-medium text-slate-800 dark:text-white mt-0.5">{formatDate(c.scheduled_at, 'h:mm a')}</p>
                                            </div>
                                            <div>
                                              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">End</p>
                                              <p className="text-[13px] font-medium text-slate-800 dark:text-white mt-0.5">{formatDate(endTime.toISOString(), 'h:mm a')}</p>
                                            </div>
                                          </div>
                                          <div>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">Scheduled at</p>
                                            <p className="text-[12px] text-slate-600 dark:text-slate-300">{formatDate(c.scheduled_at, 'EEE, MMM d yyyy')}</p>
                                          </div>
                                        </div>

                                        {/* Meeting Link + Email */}
                                        <div className="space-y-3">
                                          <div>
                                            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Meeting Link</p>
                                            <a
                                              href={getVideoRoom(c)}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-0.5 transition-colors"
                                            >
                                              <Video size={12} />
                                              {c.type === 'video' ? 'Connect Meeting' : 'Join Session'}
                                            </a>
                                          </div>
                                          <div>
                                            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email</p>
                                            <p className="text-[12px] text-slate-600 dark:text-slate-300 mt-0.5">{client?.email ?? '—'}</p>
                                          </div>
                                        </div>

                                        {/* Client response */}
                                        <div className="space-y-3">
                                          <div>
                                            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Client Response</p>
                                            <span className={`inline-flex items-center mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                                              c.client_response === 'accepted' ? 'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                                              : c.client_response === 'declined' ? 'bg-red-100 dark:bg-red-900/25 text-red-700 dark:text-red-400'
                                              : c.client_response === 'reschedule_requested' ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400'
                                              : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500'
                                            }`}>{c.client_response.replace('_', ' ')}</span>
                                          </div>
                                          {c.proposed_scheduled_at && (
                                            <div>
                                              <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Proposed Time</p>
                                              <p className="text-[12px] text-amber-600 dark:text-amber-400 mt-0.5">
                                                {formatDate(c.proposed_scheduled_at, 'EEE, MMM d · h:mm a')}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Meeting Notes */}
                                      {(c.notes || c.client_response_note) && (
                                        <div className="px-4 sm:px-5 pb-4">
                                          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Meeting Notes</p>
                                          <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-white/[0.02] rounded-xl p-3 border border-slate-100 dark:border-white/[0.04]">
                                            {c.notes}
                                            {c.client_response_note && (
                                              <span className="block mt-2 text-slate-500 italic">Client: {c.client_response_note}</span>
                                            )}
                                          </p>
                                        </div>
                                      )}

                                      {/* Action buttons */}
                                      <div className="flex items-center gap-2 px-4 sm:px-5 pb-4 flex-wrap bg-white dark:bg-[#171717]">
                                        {c.status === 'scheduled' && (
                                          <>
                                            {c.type === 'video' && (
                                              <a
                                                href={getVideoRoom(c)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold bg-cyan-950 hover:bg-cyan-900 text-white transition-colors shadow-sm">
                                                <Video size={13} /> Join Call
                                              </a>
                                            )}
                                            {c.type === 'call' && client?.phone && (
                                              <a href={`tel:${client.phone}`}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm">
                                                <PhoneCall size={13} /> Call Now
                                              </a>
                                            )}
                                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold bg-cyan-950 hover:bg-cyan-900 text-white transition-colors shadow-sm">
                                              <RefreshCw size={13} /> Reschedule
                                            </button>
                                            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/15 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/30">
                                              Cancel
                                            </button>
                                          </>
                                        )}
                                        <button
                                          onClick={() => setActiveChatId(activeChatId === `chat-${c.id}` ? null : `chat-${c.id}`)}
                                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors ml-auto ${
                                            activeChatId === `chat-${c.id}`
                                              ? 'bg-purple-600 text-white'
                                              : 'text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                                          }`}>
                                          <MessageCircle size={13} />
                                          {activeChatId === `chat-${c.id}` ? 'Close Chat' : 'Open Chat'}
                                        </button>
                                      </div>

                                      {/* ── Inline chat panel ── */}
                                      {activeChatId === `chat-${c.id}` && (
                                        <div className="border-t border-slate-200 dark:border-white/[0.06] flex flex-col" style={{ height: 300 }}>
                                          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-[#141414] border-b border-slate-200 dark:border-white/[0.05]">
                                            {socketConnected
                                              ? <><Wifi size={10} className="text-emerald-400" /><span className="text-[10px] text-emerald-400">Connected · live chat</span></>
                                              : <><WifiOff size={10} className="text-slate-500" /><span className="text-[10px] text-slate-500">Offline — messages saved via REST</span></>}
                                          </div>
                                          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-[#141414]">
                                            {allMessages.filter((m: any) => {
                                              const checkinTime = new Date(c.scheduled_at).getTime()
                                              const msgTime = new Date(m.sent_at).getTime()
                                              return Math.abs(checkinTime - msgTime) < 2 * 60 * 60 * 1000
                                            }).concat(
                                              allMessages.slice(-5)
                                            ).filter((m: any, i: number, arr: any[]) => arr.findIndex(x => x.id === m.id) === i
                                            ).sort((a: any, b: any) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
                                            ).map((m: any) => (
                                              <div key={m.id} className={`flex ${m.sender_role === 'coach' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-[12px] ${
                                                  m.sender_role === 'coach'
                                                    ? 'bg-cyan-950 text-white'
                                                    : 'bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/[0.07] text-slate-700 dark:text-slate-300'
                                                }`}>
                                                  <p>{m.content}</p>
                                                  <p className={`text-[10px] mt-0.5 ${m.sender_role === 'coach' ? 'text-blue-200' : 'text-slate-500'}`}>{timeAgo(m.sent_at)}</p>
                                                </div>
                                              </div>
                                            ))}
                                            {allMessages.length === 0 && (
                                              <p className="text-center text-[12px] text-slate-400 py-6">No messages yet — say hello!</p>
                                            )}
                                            <div ref={chatEndRef} />
                                          </div>
                                          <div className="p-3 border-t border-slate-200 dark:border-white/[0.05] bg-white dark:bg-[#171717] flex gap-2">
                                            <input
                                              value={msg}
                                              onChange={e => setMsg(e.target.value)}
                                              onKeyDown={e => e.key === 'Enter' && handleSend()}
                                              placeholder="Send a message…"
                                              className="flex-1 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.07] rounded-xl px-3 py-2 text-[12px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-blue-400 dark:focus:border-white/[0.18]"
                                            />
                                            <button onClick={handleSend} disabled={!msg.trim()}
                                              className="px-3 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-white transition-colors disabled:opacity-40">
                                              <Send size={13} />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )
              })()}

            </div>
          </main>

        </div>
      </div>

      {/* ══════════ SCHEDULE MODAL ══════════ */}
      {scheduleModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#171717] border border-slate-200 dark:border-white/[0.1] rounded-2xl w-full max-w-[440px] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.07]">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">Schedule Event</h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {scheduleModal.date
                    ? formatDate(scheduleModal.date.toISOString(), 'EEEE, MMMM d, yyyy')
                    : 'New meeting'}
                </p>
              </div>
              <button
                onClick={() => setScheduleModal({ open: false, date: null })}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Date + Time row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={e => setScheduleForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-slate-900 dark:text-white outline-none focus:border-slate-300 dark:focus:border-white/[0.2] [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">Time</label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={e => setScheduleForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-slate-900 dark:text-white outline-none focus:border-slate-300 dark:focus:border-white/[0.2] [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['video', 'call', 'chat'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setScheduleForm(f => ({ ...f, type: t }))}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[12px] font-semibold transition-colors capitalize ${
                        scheduleForm.type === t
                          ? t === 'video' ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                            : t === 'call' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                            : 'border-purple-500/50 bg-purple-500/10 text-purple-400'
                          : 'border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-white/[0.14]'
                      }`}>
                      {t === 'video' ? <Video size={12} />
                        : t === 'call' ? <PhoneCall size={12} />
                        : <Hash size={12} />}
                      {t === 'video' ? 'Video' : t === 'call' ? 'Call' : 'Chat'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting link (video only) */}
              {scheduleForm.type === 'video' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">Meeting Link <span className="text-slate-700 normal-case font-normal">(optional — auto-generated if blank)</span></label>
                  <input
                    type="url"
                    value={scheduleForm.meeting_link}
                    onChange={e => setScheduleForm(f => ({ ...f, meeting_link: e.target.value }))}
                    placeholder="https://meet.example.com/room"
                    className="w-full bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none focus:border-slate-300 dark:focus:border-white/[0.2]"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">Notes</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Agenda, topics to discuss…"
                  className="w-full bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none focus:border-slate-300 dark:focus:border-white/[0.2] resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-white/[0.07]">
              <button
                onClick={() => setScheduleModal({ open: false, date: null })}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.15] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleScheduleSubmit}
                disabled={scheduling || !scheduleForm.date}
                className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-cyan-950 hover:bg-cyan-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                {scheduling && <RefreshCw size={12} className="animate-spin" />}
                {scheduling ? 'Scheduling…' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

