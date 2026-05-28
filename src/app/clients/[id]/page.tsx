"use client"
import {
  useClient, useClientAnalytics, useMessages, useSendMessage,
  useCheckins, useCreateCheckin, useUpdateCheckin, useDeleteCheckin, useWorkoutPlans, useNutritionPlans,
  useNutritionPlan, useRegenerateCode, useClientMedia, useWorkoutLogs,
  useUpdateNutritionPlan, useDeleteWorkoutPlan, useDeleteClient, useUpdateClient,
  useUploadMessageMedia, useBlockClient, useUnblockClient, useWorkoutProgress,
} from '@/lib/hooks'
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import DashboardHeader from '@/components/layout/DashboardHeader'
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Send,
  Video,
  ImageIcon,
  Dumbbell,
  Salad,
  BarChart2,
  MessageCircle,
  Phone,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  MoreVertical,
  Tag,
  User,
  X,
  Menu,
  CheckCircle2,
  Clock,
  PhoneCall,
  Hash,
  Wifi,
  WifiOff,
  Loader2,
  Pencil,
  Trash2,
  Paperclip,
  Download,
  Play,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { formatDate, timeAgo } from '@/lib/utils'
import { useSocketChat } from '@/lib/useSocketChat'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import type { CheckinMeeting, NutritionPlan, WorkoutPlan, WorkoutLogDetailed } from '@/types'
import type { WorkoutProgressPlan } from '@/lib/api/services/media'
import {
  ClientDetailSidebar,
  ScheduleModal,
  DeleteConfirmModal,
  ClientWorkoutsTab,
  ClientNutritionTab,
  ClientAnalyticsTab,
  ClientMessagesTab,
  ClientScheduleTab,
} from '@/components/clients'
import type { ScheduleFilter } from '@/components/clients'

// Navigation handler for back button
const goBack = (router: ReturnType<typeof useRouter>) => {
  // Try to go back in history, fallback to clients page
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/clients')
  }
}

const DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']



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
}

{/*function generateCalendarDays(year: number, month: number, events: CalendarEvent[]): DayData[][] {
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
}*/}

type TabKey = 'workouts' | 'nutrition' | 'analytics' | 'messages' | 'checkins'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'workouts',  label: 'Workouts'   },
  { key: 'nutrition', label: 'Nutrition'  },
  { key: 'analytics', label: 'Analytics'  },
  { key: 'messages',  label: 'Messages'   },
  { key: 'checkins',  label: 'Schedule'  },
]

interface ScheduleForm {
  date: string; time: string
  type: 'call' | 'video' | 'chat'
  meeting_link: string; notes: string
}
interface ScheduleModalState {
  open: boolean
  date: Date | null
  checkinId: string | null
}
const DEFAULT_FORM: ScheduleForm = { date: '', time: '09:00', type: 'video', meeting_link: '', notes: '' }
const DEFAULT_SCHEDULE_MODAL: ScheduleModalState = { open: false, date: null, checkinId: null }

function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age >= 0 ? age : null
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [msg, setMsg]               = useState('')
  const [copied, setCopied]         = useState(false)
  const [newCode, setNewCode]       = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('workouts')
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>(DEFAULT_SCHEDULE_MODAL)
  const [scheduleForm, setScheduleForm]   = useState<ScheduleForm>(DEFAULT_FORM)
  const [scheduling, setScheduling]       = useState(false)
  // Check-in chat panel (which check-in ID has chat open)
  const [activeChatId, setActiveChatId]   = useState<string | null>(null)
  const [expandedPlan, setExpandedPlan]   = useState<string | null>(null)
  const [scheduleFilter, setScheduleFilter] = useState<'Upcoming' | 'Ongoing' | 'Rescheduled' | 'Cancelled'>('Upcoming')
  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; type: 'client' | 'workout'; item?: any }>({ open: false, type: 'client' })
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // Edit client modal
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', date_of_birth: '', city: '', address: '', notes: '',
    current_weight_kg: '', height_cm: '', nationality: '', occupation: '', sickness: '',
  })
  const [editSaving, setEditSaving] = useState(false)
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
  const { data: workoutProgress }  = useWorkoutProgress(id)
  const sendMsg                     = useSendMessage()
  const uploadMedia                 = useUploadMessageMedia()
  const regenerateCode              = useRegenerateCode(id)
  const [pendingFile, setPendingFile] = useState<{ media_url: string; media_type: string; media_filename: string } | null>(null)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const createCheckin               = useCreateCheckin()
  const updateCheckin               = useUpdateCheckin()
  const deleteCheckin               = useDeleteCheckin()
  const deleteWorkoutPlan           = useDeleteWorkoutPlan()
  const deleteClient                = useDeleteClient()
  const updateClient                = useUpdateClient(id)
  const blockClient                 = useBlockClient(id)
  const unblockClient               = useUnblockClient(id)
  const { connected: socketConnected, incomingMessages, relayViaSocket, clearIncoming } = useSocketChat(id)

  const calendarEvents = useMemo(() => {
    const ev: { id: string; title: string; date: Date; type: string; color: string; details?: string; planId?: string }[] = []
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

  const closeScheduleModal = useCallback(() => {
    setScheduleModal(DEFAULT_SCHEDULE_MODAL)
    setScheduleForm(DEFAULT_FORM)
  }, [])

  const formatScheduleFormDate = useCallback((value: string) => {
    const date = new Date(value)
    const pad = (n: number) => String(n).padStart(2, '0')
    return {
      date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    }
  }, [])

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
    try {
      await sendMsg.mutateAsync(payload)
      relayViaSocket(content)
    } catch {
      // Error toast is handled by useToastMutation
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await uploadMedia.mutateAsync(file)
      setPendingFile(result)
    } catch {
      toast.error('Failed to upload file.')
    }
    e.target.value = ''
  }

  const handleRegenerate = async () => {
    if (!confirm('Regenerate code? The old code will stop working immediately.')) return
    const res = await regenerateCode.mutateAsync()
    setNewCode(res.data.login_code)
  }

  const handleDeleteClient = async () => {
    setDeleteError(null)
    setDeleteModal({ open: true, type: 'client' })
  }

  const handleConfirmDeleteClient = async () => {
    try {
      await deleteClient.mutateAsync(id)
      setDeleteError(null)
      setDeleteModal({ open: false, type: 'client' })
      router.push('/clients')
    } catch (err: any) {
      console.error('Delete client error:', err)
      const message = err?.response?.data?.message || err?.message || 'Unknown error'
      setDeleteError(message)
    }
  }

  const handleDeleteWorkout = async (plan: WorkoutPlan) => {
    setDeleteError(null)
    setDeleteModal({ open: true, type: 'workout', item: plan })
  }

  const handleConfirmDeleteWorkout = async () => {
    if (!deleteModal.item) return
    try {
      if (expandedPlan === deleteModal.item.id) setExpandedPlan(null)
      await deleteWorkoutPlan.mutateAsync(deleteModal.item.id)
      setDeleteError(null)
      setDeleteModal({ open: false, type: 'client' })
    } catch {
      setDeleteError('Failed to delete workout plan.')
    }
  }

  const handleToggleBlockClient = async () => {
    // Determine whether the client should be treated as blocked:
    //  - If is_blocked is explicitly set, it takes precedence (true = blocked, false = active).
    //  - If is_blocked is undefined/null (legacy data), fall back to the active flag:
    //    active=false is treated as "inactive/blocked" for backward compatibility.
    const computedIsBlocked = client?.is_blocked ?? !client?.active

    if (!confirm(`${computedIsBlocked ? 'Unblock' : 'Block'} client "${client?.name}"?${!computedIsBlocked ? ' This will immediately invalidate all their sessions and login codes.' : ''}`)) return

    try {
      if (computedIsBlocked) {
        await unblockClient.mutateAsync()
      } else {
        await blockClient.mutateAsync()
      }
    } catch {
      toast.error(`Failed to ${computedIsBlocked ? 'unblock' : 'block'} client.`)
    }
  }

  const handleOpenEdit = () => {
    if (!client) return
    setEditForm({
      name: client.name ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      date_of_birth: client.date_of_birth ?? '',
      city: client.city ?? '',
      address: client.address ?? '',
      notes: client.notes ?? '',
      current_weight_kg: client.current_weight_kg != null ? String(client.current_weight_kg) : '',
      height_cm: client.height_cm != null ? String(client.height_cm) : '',
      nationality: client.nationality ?? '',
      occupation: client.occupation ?? '',
      sickness: client.sickness ?? '',
    })
    setEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Name is required')
      return
    }
    setEditSaving(true)
    try {
      const payload: Record<string, any> = {
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        date_of_birth: editForm.date_of_birth || undefined,
        city: editForm.city.trim() || undefined,
        address: editForm.address.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
        nationality: editForm.nationality.trim() || undefined,
        occupation: editForm.occupation.trim() || undefined,
        sickness: editForm.sickness.trim() || undefined,
      }
      if (editForm.current_weight_kg.trim()) {
        const w = parseFloat(editForm.current_weight_kg)
        if (!isNaN(w)) payload.current_weight_kg = w
      }
      if (editForm.height_cm.trim()) {
        const h = parseInt(editForm.height_cm, 10)
        if (!isNaN(h)) payload.height_cm = h
      }
      await updateClient.mutateAsync(payload)
      setEditModal(false)
    } catch {
      toast.error('Failed to update client')
    } finally {
      setEditSaving(false)
    }
  }

  // ── Schedule from calendar ────────────────────────────────────────────────
  const openScheduleModal = useCallback((date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    setScheduleForm({ ...DEFAULT_FORM, date: dateStr })
    setScheduleModal({ open: true, date, checkinId: null })
  }, [])

  const handleRescheduleCheckin = useCallback((meeting: CheckinMeeting) => {
    const nextDate = new Date(meeting.scheduled_at)
    setScheduleForm({
      ...DEFAULT_FORM,
      ...formatScheduleFormDate(meeting.scheduled_at),
      type: meeting.type,
      meeting_link: meeting.meeting_link ?? '',
      notes: meeting.notes ?? '',
    })
    setScheduleModal({ open: true, date: nextDate, checkinId: meeting.id })
  }, [formatScheduleFormDate])

  const handleCancelCheckin = useCallback(async (meeting: CheckinMeeting) => {
    const scheduledLabel = formatDate(meeting.scheduled_at, 'EEE, MMM d · h:mm a')
    if (!confirm(`Cancel this ${meeting.type} meeting on ${scheduledLabel}?`)) return

    try {
      await deleteCheckin.mutateAsync(meeting.id)
      if (activeChatId === `chat-${meeting.id}`) {
        setActiveChatId(null)
      }
    } catch {
      alert('Failed to cancel check-in. Please try again.')
    }
  }, [activeChatId, deleteCheckin])

  const handleScheduleSubmit = async () => {
    if (!scheduleForm.date || !scheduleForm.time) return
    setScheduling(true)
    try {
      const payload = {
        scheduled_at: `${scheduleForm.date}T${scheduleForm.time}:00`,
        type: scheduleForm.type,
        meeting_link: scheduleForm.meeting_link || undefined,
        notes: scheduleForm.notes || undefined,
        status: 'scheduled',
      } as const

      if (scheduleModal.checkinId) {
        await updateCheckin.mutateAsync({ id: scheduleModal.checkinId, ...payload })
      } else {
        await createCheckin.mutateAsync({ client_id: id, ...payload })
      }

      closeScheduleModal()
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
    <div className="flex flex-col bg-[var(--bg-page)] dark:bg-[var(--bg-page)] animate-pulse min-h-[calc(100vh-4rem)]">
      <div className="h-11 bg-[var(--bg-card)] border-b border-[var(--border)] dark:border-white/[0.06]" />
      <div className="flex flex-1">
        <div className="hidden md:block w-[300px] border-r border-[var(--border)] dark:border-white/[0.06]" />
        <div className="flex-1 p-4 sm:p-6 space-y-4">
          <div className="h-7 w-52 bg-slate-200 dark:bg-white/[0.06] " />
          <div className="h-72 bg-white dark:bg-white/[0.04] border border-[var(--border)] dark:border-white/[0.06] " />
        </div>
      </div>
    </div>
  )

  if (!client) return (
    <div className="flex items-center justify-center bg-[var(--bg-page)] dark:bg-[var(--bg-page)] min-h-[calc(100vh-4rem)]">
      <p className="text-slate-500 text-sm">Client not found.</p>
    </div>
  )

  const completedCheckins = (checkins ?? []).filter((c: any) => c.status === 'completed').length

  return (
    <>
      <div className="flex flex-col bg-[var(--bg-page)] dark:bg-[var(--bg-page)] min-h-[calc(100vh-4rem)]">

        {/* ── Dashboard Header ─────────────────────────────────────── */}
        <DashboardHeader
          title={client.name}
          subtitle={`${client.active ? 'Active' : 'Inactive'} client · ${client.email || 'No email'} · Joined ${formatDate(client.created_at, 'MMM d, yyyy')}`}
          quickActions={[
            {
              href: `/messages?client=${id}`,
              label: 'Message',
              icon: MessageCircle,
              color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
            },
            {
              href: `/clients/${id}/analytics`,
              label: 'Analytics',
              icon: BarChart2,
              color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50',
            },
          ]}
        />

        {/* ── Breadcrumb bar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 sm:px-5 h-11 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-white">
              <Menu size={16} />
            </button>
            <Link href="/clients" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex-shrink-0">
              <ArrowLeft size={13} /> <span className="hidden sm:inline">Clients</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline"></span>
            <span className="text-slate-700 dark:text-slate-300 truncate">{client.name}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleToggleBlockClient}
              disabled={blockClient.isPending || unblockClient.isPending}
              title={client.is_blocked ? 'Restore client access' : client.active ? 'Temporarily disable client access' : 'Restore client access'}
              className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                client.is_blocked || !client.active
                  ? 'border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                  : 'border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10'
              }`}
            >
              {(blockClient.isPending || unblockClient.isPending) ? <Loader2 size={13} className="animate-spin" /> : (client.is_blocked || !client.active) ? <Check size={13} /> : <X size={13} />}
              {client.is_blocked ? 'Unblock' : !client.active ? 'Restore Access' : 'Block Access'}
            </button>
            <button
              onClick={handleOpenEdit}
              disabled={updateClient.isPending}
              title="Edit client information"
              className="inline-flex items-center gap-1.5 border border-[var(--border)] dark:border-white/[0.07] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
            >
              <Pencil size={13} />
              Edit
            </button>
            <button
              onClick={handleDeleteClient}
              disabled={deleteClient.isPending}
              title="Permanently delete this client (cannot be undone)"
              className="inline-flex rounded-s-xl items-center gap-1.5 border border-red-200 dark:border-red-900/40 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {deleteClient.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete Permanently
            </button>
            <div className="hidden lg:flex items-center gap-2 bg-[var(--bg-subtle)] border border-[var(--border)] dark:border-white/[0.07] px-3 py-1.5">
              <Search size={13} className="text-slate-500 dark:text-slate-600" />
              <input placeholder="Search" className="bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none w-28" />
              <kbd className="text-[10px] text-slate-500 dark:text-slate-700 bg-white dark:bg-white/[0.04] border border-[var(--border)] dark:border-white/[0.06] px-1.5 py-0.5 font-mono">⌘F</kbd>
            </div>
            
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Left panel — sidebar */}
          <ClientDetailSidebar
            client={client}
            sidebarOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            newCode={newCode}
            copied={copied}
            onCopied={() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            media={media}
            plans={plans}
            nutrition={nutrition}
            analytics={analytics}
            checkins={checkins}
            completedCheckins={completedCheckins}
            onRegenerate={handleRegenerate}
            isRegenerateLoading={regenerateCode.isPending}
            onToggleBlock={handleToggleBlockClient}
            isBlockPending={blockClient.isPending}
            isUnblockPending={unblockClient.isPending}
            onDeleteClient={handleDeleteClient}
            isDeletePending={deleteClient.isPending}
            onEditClient={handleOpenEdit}
          />

          {/* ══════════ RIGHT PANEL ══════════ */}
          <main className="flex-1 flex flex-col overflow-hidden">

            {/* Tab navigation */}
            <div className="flex items-center border-b border-[var(--border)] dark:border-white/[0.06] bg-white dark:bg-[#121212] px-2 sm:px-5 overflow-x-auto flex-shrink-0 scrollbar-hide">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-2.5 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-[12px] font-semibold whitespace-nowrap border-b-2 transition-all -mb-px ${
                    tab === key
                      ? 'border-[#f97316] text-[var(--text-primary)] dark:text-[var(--text-primary)]'
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
              

              {/* ─── Workouts tab ─────────────────────────────── */}
              {tab === 'workouts' && (
                <ClientWorkoutsTab
                  clientId={id} plans={plans}
                  workoutProgress={workoutProgress} workoutLogs={workoutLogs}
                  completedDaysMap={completedDaysMap} expandedPlan={expandedPlan} setExpandedPlan={setExpandedPlan}
                  expandedLog={expandedLog} setExpandedLog={setExpandedLog}
                  onDeleteWorkout={handleDeleteWorkout} isDeleteWorkoutPending={deleteWorkoutPlan.isPending}
                />
              )}

              {/* ─── Nutrition tab ──────────────────────────────── */}
              {tab === 'nutrition' && (
                <ClientNutritionTab
                  clientId={id} nutrition={nutrition}
                  expandedPlan={expandedPlan} setExpandedPlan={setExpandedPlan}
                />
              )}

              {/* ─── Analytics tab ──────────────────────────────── */}
              {tab === 'analytics' && (
                <ClientAnalyticsTab analytics={analytics} />
              )}

              {/* ─── Messages tab ───────────────────────────────── */}
              {tab === 'messages' && (
                <ClientMessagesTab client={client} allMessages={allMessages}
                  msg={msg} setMsg={setMsg}
                  onSend={handleSend}
                  isSendPending={sendMsg.isPending} isUploadPending={uploadMedia.isPending}
                  pendingFile={pendingFile} onClearPendingFile={() => setPendingFile(null)} onFileSelect={handleFileSelect}
                  socketConnected={socketConnected} msgLoading={msgLoading} messagesEndRef={messagesEndRef} /> )}

              {/* ─── Schedule tab ──────────────────────────────── */}
              {tab === 'checkins' && (
                <ClientScheduleTab
                  client={client} checkins={checkins} scheduleFilter={scheduleFilter}
                  setScheduleFilter={setScheduleFilter} activeChatId={activeChatId}
                  setActiveChatId={setActiveChatId} allMessages={allMessages} msg={msg}
                  setMsg={setMsg} onSend={handleSend}
                  chatEndRef={chatEndRef} socketConnected={socketConnected}
                  isDeleteCheckinPending={deleteCheckin.isPending} onOpenScheduleModal={openScheduleModal}
                  onReschedule={handleRescheduleCheckin} onCancel={handleCancelCheckin}
                /> )}
            </div>
          </main>

        </div>
      </div>

      {/* Schedule modal */}
      <ScheduleModal
        open={scheduleModal.open}
        onClose={closeScheduleModal}
        checkinId={scheduleModal.checkinId}
        form={scheduleForm}
        onFormChange={updates => setScheduleForm(f => ({ ...f, ...updates }))}
        onSubmit={handleScheduleSubmit}
        isSubmitting={scheduling}
      />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        open={deleteModal.open}
        type={deleteModal.type}
        clientName={client?.name ?? ''}
        planTitle={deleteModal.item?.title}
        onClose={() => { setDeleteError(null); setDeleteModal({ open: false, type: 'client' }) }}
        onConfirm={deleteModal.type === 'client' ? handleConfirmDeleteClient : handleConfirmDeleteWorkout}
        isLoading={deleteClient.isPending || deleteWorkoutPlan.isPending}
        error={deleteError}
      />

      {/* Edit client modal */}
      {editModal && client && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !editSaving && setEditModal(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-lg rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Edit Client</h3>
              <button onClick={() => setEditModal(false)} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Name *</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Phone</label>
                  <input
                    value={editForm.phone}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={e => setEditForm(f => ({ ...f, date_of_birth: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">City</label>
                  <input
                    value={editForm.city}
                    onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Address</label>
                <input
                  value={editForm.address}
                  onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.current_weight_kg}
                    onChange={e => setEditForm(f => ({ ...f, current_weight_kg: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Height (cm)</label>
                  <input
                    type="number"
                    value={editForm.height_cm}
                    onChange={e => setEditForm(f => ({ ...f, height_cm: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Nationality</label>
                  <input
                    value={editForm.nationality}
                    onChange={e => setEditForm(f => ({ ...f, nationality: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Occupation</label>
                  <input
                    value={editForm.occupation}
                    onChange={e => setEditForm(f => ({ ...f, occupation: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Health Conditions</label>
                <input
                  value={editForm.sickness}
                  onChange={e => setEditForm(f => ({ ...f, sickness: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => setEditModal(false)}
                disabled={editSaving}
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="px-4 py-2 bg-[var(--btn-bg)] text-[var(--btn-text)] text-sm font-medium hover:bg-[var(--btn-hover)] transition-colors disabled:opacity-50 rounded-lg"
              >
                {editSaving ? <Loader2 size={13} className="animate-spin inline mr-1" /> : null}
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

