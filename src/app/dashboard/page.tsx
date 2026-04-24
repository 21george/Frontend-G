'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useClients, useCheckins, useWorkoutPlans } from '@/lib/hooks'
import { useState, useMemo } from 'react'
import {
  Users, Calendar, ChevronLeft, ChevronRight, MoreHorizontal,
  Download, Filter, Video, Play, Clock, ArrowRight, Flame,
  Heart, Activity, TrendingUp, Zap, Target, Award, MapPin,
  Timer, Footprints
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, parseDateValue } from '@/lib/utils'
import type { Client, WorkoutPlan, CheckinMeeting } from '@/types'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns'
import { motion } from 'framer-motion'

const ACTIVITY_ICON: Record<string, typeof Play> = {
  'Push Day': Play,
  'Pull Day': Play,
  'Leg Day': Play,
  'Cardio Day': Play,
  'Rest Day': Clock,
}

const ACTIVITY_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  'Push Day': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/30' },
  'Pull Day': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800/30' },
  'Leg Day': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/30' },
  'Cardio Day': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/30' },
  'Rest Day': { bg: 'bg-slate-50 dark:bg-slate-800/20', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700/30' },
}

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/* ── Circular Progress Component ───────────────────────────────────────────── */
function CircularProgress({
  value,
  max,
  size = 180,
  strokeWidth = 12,
  children,
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(value / max, 1)
  const dashoffset = circumference - progress * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200 dark:text-white/[0.05]"
        />
        {/* Progress circle with gradient */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

/* ── Activities Card ───────────────────────────────────────────────────────── */
function ActivitiesCard({ clients }: { clients: Client[] }) {
  // Mock activity data - in production this would come from API
  const activityData = useMemo(() => ({
    weeklyGoal: 7,
    completedWorkouts: 5,
    avgHeartRate: 138,
    caloriesBurned: 2450,
    steps: 45230,
    activeMinutes: 312,
    workouts: [
      { day: 'Mon', completed: true, type: 'Push Day', intensity: 'high' },
      { day: 'Tue', completed: true, type: 'Cardio', intensity: 'medium' },
      { day: 'Wed', completed: true, type: 'Pull Day', intensity: 'high' },
      { day: 'Thu', completed: false, type: 'Rest', intensity: 'low' },
      { day: 'Fri', completed: true, type: 'Leg Day', intensity: 'high' },
      { day: 'Sat', completed: true, type: 'Active Recovery', intensity: 'low' },
      { day: 'Sun', completed: false, type: 'Rest', intensity: 'low' },
    ],
  }), [])

  const goalProgress = (activityData.completedWorkouts / activityData.weeklyGoal) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#171717] p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Activities</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Weekly activity overview</p>
          </div>
        </div>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
          <MoreHorizontal className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="flex items-start gap-6">
        {/* Circular Progress */}
        <div className="flex-shrink-0">
          <CircularProgress value={activityData.completedWorkouts} max={activityData.weeklyGoal} size={160} strokeWidth={10}>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {activityData.completedWorkouts}/{activityData.weeklyGoal}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">workouts</div>
            </div>
          </CircularProgress>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-xl p-3 border border-orange-200/60 dark:border-orange-800/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">Calories</span>
            </div>
            <div className="text-xl font-bold text-orange-900 dark:text-orange-100">{activityData.caloriesBurned.toLocaleString()}</div>
            <div className="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5">kcal burned</div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 rounded-xl p-3 border border-red-200/60 dark:border-red-800/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-red-700 dark:text-red-300">Avg HR</span>
            </div>
            <div className="text-xl font-bold text-red-900 dark:text-red-100">{activityData.avgHeartRate}</div>
            <div className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">bpm</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl p-3 border border-blue-200/60 dark:border-blue-800/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                <Footprints className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Steps</span>
            </div>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{(activityData.steps / 1000).toFixed(1)}k</div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">total steps</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl p-3 border border-emerald-200/60 dark:border-emerald-800/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Timer className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Active</span>
            </div>
            <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{activityData.activeMinutes}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">minutes</div>
          </div>
        </div>
      </div>

      {/* Weekly Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Weekly Progress</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white">{Math.round(goalProgress)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
      </div>

      {/* Workout List */}
     
    </motion.div>
  )
}

/* ── Smart Activity Overview ──────────────────────────────────────────────── */
function SmartActivityOverview({ clients }: { clients: Client[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d')

  // Mock data for the chart
  const chartData = useMemo(() => [
    { day: 'Mon', workouts: 5, calories: 2100, hr: 132 },
    { day: 'Tue', workouts: 4, calories: 1800, hr: 128 },
    { day: 'Wed', workouts: 6, calories: 2400, hr: 145 },
    { day: 'Thu', workouts: 3, calories: 1500, hr: 118 },
    { day: 'Fri', workouts: 7, calories: 2800, hr: 152 },
    { day: 'Sat', workouts: 4, calories: 1900, hr: 135 },
    { day: 'Sun', workouts: 2, calories: 1200, hr: 108 },
  ], [])

  const maxWorkouts = Math.max(...chartData.map(d => d.workouts))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-[#171717] p-6 "
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Smart Activity Overview</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Performance insights & trends</p>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/[0.06] rounded-lg">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedPeriod === period
                  ? 'bg-white dark:bg-[#171717] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Chart */}
      <div className="mb-6">
        <div className="flex items-end justify-between gap-2 h-32">
          {chartData.map((data, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-t-lg h-24 relative overflow-hidden flex items-end">
                <div
                  className="w-full bg-gradient-to-t from-cyan-500 via-blue-500 to-purple-500 opacity-80 rounded-t-lg transition-all duration-500"
                  style={{ height: `${(data.workouts / maxWorkouts) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{data.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="text-center p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl">
          <div className="text-lg font-bold text-slate-900 dark:text-white">31</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Total Workouts</div>
        </div>
        <div className="text-center p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl">
          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">13.7k</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Avg Calories</div>
        </div>
        <div className="text-center p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl">
          <div className="text-lg font-bold text-red-600 dark:text-red-400">131</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Avg Heart Rate</div>
        </div>
        <div className="text-center p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl">
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">89%</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Goal Achievement</div>
        </div>
      </div>

      {/* Insights Section */}
      
    </motion.div>
  )
}

/* ── Live Session Widget ───────────────────────────────────────────────────── */
function LiveSessionWidget({ clients, checkins }: { clients: Client[]; checkins: CheckinMeeting[] }) {
  const liveClients = useMemo(() => {
    return clients.slice(0, Math.min(3, clients.length))
  }, [clients])

  const isLive = liveClients.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white dark:bg-[#171717] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Live Session</h2>
        </div>
        {isLive && (
          <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
            LIVE
          </span>
        )}
      </div>

      {isLive ? (
        <>
          <div className="mb-4">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{liveClients.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">clients attending</p>
          </div>

          <div className="flex -space-x-2 mb-4">
            {liveClients.map((client, i) => (
              <div
                key={client.id}
                className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-[#171717] overflow-hidden"
              >
                {client.profile_photo_url ? (
                  <img src={client.profile_photo_url} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                    {client.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {liveClients.length > 3 && (
              <div className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-[#171717] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-400">
                +{liveClients.length - 3}
              </div>
            )}
          </div>

          <button className="w-full py-2 bg-cyan-950 hover:bg-cyan-900 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors">
            <Video size={16} />
            Join Session
          </button>
        </>
      ) : (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <Video size={20} className="text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">No live session</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start a session to connect with clients</p>
        </div>
      )}
    </motion.div>
  )
}

/* ── Weekly Schedule Widget ───────────────────────────────────────────────── */
function WeeklyScheduleWidget({ checkins, clients }: { checkins: CheckinMeeting[]; clients: Client[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients])

  const getEventsForDay = (day: Date) => {
    return checkins.filter(c => {
      const eventDate = parseDateValue(c.scheduled_at)
      return eventDate && isSameDay(eventDate, day)
    })
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      video: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-700/30' },
      call: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700/30' },
      chat: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-700/30' },
    }
    return colors[type] || colors.chat
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-[#171717] p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Weekly Schedule</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}
            className="p-1 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded"
          >
            <ChevronLeft size={16} className="text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}
            className="p-1 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded"
          >
            <ChevronRight size={16} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {DAYS_SHORT.map((day, i) => {
          const dayDate = weekDays[i]
          const isTodayDay = dayDate && isToday(dayDate)
          return (
            <div key={day} className="text-center">
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">{day}</div>
              <div className={`text-sm font-semibold w-7 h-7 flex items-center justify-center mx-auto rounded-full ${
                isTodayDay
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-900 dark:text-white'
              }`}>
                {dayDate ? format(dayDate, 'd') : ''}
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {weekDays.map((day, i) => {
          const events = getEventsForDay(day)
          const isTodayDay = day && isToday(day)

          if (events.length === 0) return null

          return (
            <div key={i} className={`p-3 rounded-lg ${isTodayDay ? 'bg-slate-50 dark:bg-white/[0.04]' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`text-xs font-semibold ${isTodayDay ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                  {DAYS_SHORT[i]}
                </div>
                <div className="h-px flex-1 bg-slate-100 dark:bg-white/[0.06]" />
              </div>
              {events.map(event => {
                const colors = getTypeColor(event.type)
                const client = clientMap.get(event.client_id)
                const eventTime = parseDateValue(event.scheduled_at)

                return (
                  <div
                    key={event.id}
                    className={`${colors.bg} ${colors.border} border rounded-md p-2 mb-1.5 last:mb-0`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${colors.text}`}>
                          {client?.name ?? 'Client'}
                        </p>
                        {eventTime && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {format(eventTime, 'h:mm a')}
                          </p>
                        )}
                      </div>
                      <div className={`text-[9px] font-medium uppercase px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                        {event.type}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

        {checkins.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Calendar size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No scheduled events</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ── Client Daily Activity Table ──────────────────────────────────────────── */
function ClientDailyActivity({ clients }: { clients: Client[] }) {
  const activities = useMemo(() => {
    const activityTypes = ['Push Day A', 'Pull Day B', 'Leg Day A', 'Cardio Day', 'Rest Day']
    return clients.slice(0, 5).map((client, i) => {
      const activityType = activityTypes[i % activityTypes.length]
      const today = new Date()
      const activityDate = new Date(today)
      activityDate.setDate(today.getDate() - i)

      return {
        id: client.id,
        client_name: client.name,
        client_photo: client.profile_photo_url,
        activity_type: activityType.split(' ')[0] + ' Day',
        date: activityDate,
        time: `${8 + (i % 4)}:00 - ${9 + (i % 4)}:00`,
        duration: `${45 + (i * 5)}m`,
        calories: 320 + (i * 50),
      }
    })
  }, [clients])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-white dark:bg-[#171717] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm"
    >
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/[0.06]">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Client Daily Activity</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Recent workouts and sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg">
            <Filter size={16} className="text-slate-600 dark:text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg">
            <Download size={16} className="text-slate-600 dark:text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg">
            <MoreHorizontal size={16} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/[0.06]">
              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Client</th>
              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Activity Type</th>
              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Time</th>
              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Duration</th>
              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Calories</th>
              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICON[activity.activity_type] || Play
              const colorClass = ACTIVITY_COLOR[activity.activity_type] || ACTIVITY_COLOR['Rest Day']
              return (
                <tr key={activity.id} className="border-b border-slate-50 dark:border-white/[0.04] hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {activity.client_photo ? (
                        <img src={activity.client_photo} alt={activity.client_name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                          {activity.client_name[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{activity.client_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-md ${colorClass.bg} ${colorClass.text}`}>
                      <Icon size={14} />
                      {activity.activity_type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {format(activity.date, 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{activity.time}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{activity.duration}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{activity.calories}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/clients/${activity.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400"
                    >
                      View <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

/* ── Main Dashboard Page ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: clientsData } = useClients()
  const { data: checkins } = useCheckins()
  const { data: workoutData } = useWorkoutPlans()

  const clients = clientsData?.data ?? []
  const workoutPlans: WorkoutPlan[] = (workoutData as any)?.data ?? workoutData ?? []
  const checkinsList = checkins ?? []

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 pb-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Welcome back, Coach
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Get an overview of your client's progress
          </p>
        </div>

        {/* Main Grid Layout - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Activities Card (2 cols) */}
          <div className="lg:col-span-2">
            <ActivitiesCard clients={clients} />
          </div>
          {/* Right Column - Live Session (1 col) */}
          <div>
            <LiveSessionWidget clients={clients} checkins={checkinsList} />
          </div>
        </div>

        {/* Second Row - Smart Activity Overview + Weekly Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <SmartActivityOverview clients={clients} />
          </div>
          <div>
            <WeeklyScheduleWidget checkins={checkinsList} clients={clients} />
          </div>
        </div>

        {/* Third Row - Client Daily Activity Table */}
        <ClientDailyActivity clients={clients} />
      </div>
    </DashboardLayout>
  )
}
