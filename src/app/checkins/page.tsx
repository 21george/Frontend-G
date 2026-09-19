"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  useCheckins,
  useClients,
  useCreateCheckin,
  useUpdateCheckin,
  useUpdateCheckinStatus,
} from "@/lib/hooks";
import { useState, useMemo, useCallback } from "react";
import { format, isPast, parseISO } from "date-fns";
import type { CheckinMeeting, Client } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { CreateCheckinModal } from "@/components/CreateCheckinModal";
import FilterBreadcrumb from "@/components/ui/Breadcrumb";
import {
  Search,
  CalendarDays,
  SlidersHorizontal,
  Plus,
  Clock,
  ChevronDown,
  X,
  RotateCcw,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Phone,
  Video,
  MessageSquare,
  Ban,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   Status & Filter Types
   ═══════════════════════════════════════════════════════════════════ */
type StatusFilter = "all" | "scheduled" | "overdue" | "completed" | "cancelled";

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_META: Record<
  string,
  {
    label: string;
    dot: string;
    lightClass: string;
    darkClass: string;
    icon: React.ElementType | null;
  }
> = {
  scheduled: {
    label: "Scheduled",
    dot: "bg-blue-500",
    lightClass: "bg-blue-50 text-blue-700 border border-blue-200/60",
    darkClass: "dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    icon: null,
  },
  overdue: {
    label: "Overdue",
    dot: "bg-red-500",
    lightClass: "bg-red-50 text-red-700 border border-red-200/60",
    darkClass: "dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    icon: AlertTriangle,
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    lightClass: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    darkClass:
      "dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-slate-400",
    lightClass: "bg-slate-100 text-slate-600 border border-slate-200",
    darkClass: "dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700",
    icon: XCircle,
  },
};

const TYPE_META: Record<
  string,
  { label: string; lightClass: string; darkClass: string }
> = {
  video: {
    label: "Video Call",
    lightClass: "bg-brand-50 text-brand-700 border border-brand-200/60",
    darkClass: "dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-800",
  },
  call: {
    label: "Phone Call",
    lightClass: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    darkClass:
      "dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  },
  chat: {
    label: "Chat",
    lightClass: "bg-purple-50 text-purple-700 border border-purple-200/60",
    darkClass:
      "dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
  },
};

function getItemStatus(c: CheckinMeeting): string {
  if (c.status === "completed") return "completed";
  if (c.status === "cancelled") return "cancelled";
  if (c.status === "scheduled" && isPast(parseISO(c.scheduled_at)))
    return "overdue";
  return "scheduled";
}

function filterCheckins(list: CheckinMeeting[], filter: StatusFilter) {
  if (filter === "all") return list;
  return list.filter((c) => getItemStatus(c) === filter);
}

function groupByDate(list: CheckinMeeting[]) {
  const groups: Record<string, CheckinMeeting[]> = {};
  for (const c of list) {
    const d = parseISO(c.scheduled_at);
    const key = format(d, "yyyy-MM-dd");
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => {
      const d = parseISO(key);
      return {
        key,
        date: d,
        dayName: format(d, "EEE"),
        dayNum: format(d, "d"),
        items,
      };
    });
}

/* ═══════════════════════════════════════════════════════════════════
   Reschedule Modal
   ═══════════════════════════════════════════════════════════════════ */
function RescheduleModal({
  open,
  onClose,
  checkin,
  onReschedule,
}: {
  open: boolean;
  onClose: () => void;
  checkin: CheckinMeeting | null;
  onReschedule: (id: string, scheduled_at: string) => Promise<void>;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkin || !date || !time) return;
    setIsSubmitting(true);
    try {
      await onReschedule(
        checkin.id,
        new Date(`${date}T${time}:00`).toISOString(),
      );
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-700/20 dark:focus:ring-[var(--energy)]/20 " +
    "bg-[var(--bg-card)] dark:bg-white/[0.03] border border-[var(--border)] dark:border-white/[0.08] " +
    "text-[var(--text-primary)] dark:text-white placeholder:text-[var(--text-tertiary)] dark:placeholder:text-white/20";

  return (
    <AnimatePresence>
      {open && checkin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[var(--bg-card)] dark:bg-[#0a1114]/95 rounded-2xl shadow-2xl overflow-hidden border border-[var(--border)] dark:border-white/[0.08]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] dark:border-white/[0.08]">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] dark:text-white">
                  Reschedule
                </h2>
                <p className="text-sm text-[var(--text-tertiary)] dark:text-white/40 mt-0.5">
                  Pick a new date and time
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.06] rounded-full transition-colors"
              >
                <X
                  size={18}
                  className="text-[var(--text-tertiary)] dark:text-white/40"
                />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-tertiary)] dark:text-white/40 uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-tertiary)] dark:text-white/40 uppercase tracking-wider mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] dark:text-white/60 hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !date || !time}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-brand-600 hover:bg-brand-700"
                >
                  {isSubmitting ? "Saving..." : "Reschedule"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Check-in Card (redesigned to match reference)
   ═══════════════════════════════════════════════════════════════════ */
function CheckinCard({
  checkin,
  client,
  onReschedule,
  onCancel,
}: {
  checkin: CheckinMeeting;
  client?: Client;
  onReschedule: (c: CheckinMeeting) => void;
  onCancel: (c: CheckinMeeting) => void;
}) {
  const statusKey = getItemStatus(checkin);
  const meta = STATUS_META[statusKey];
  const scheduledAt = parseISO(checkin.scheduled_at);
  const endTime = new Date(scheduledAt.getTime() + 60 * 60 * 1000);
  const StatusIcon = meta.icon;
  const typeMeta = TYPE_META[checkin.type] ?? TYPE_META.chat;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -1 }}
      className="relative bg-[var(--bg-card)] dark:bg-white/[0.02] rounded-xl border border-[var(--border)] dark:border-white/[0.06] overflow-hidden transition-colors hover:border-[var(--border-hover)] dark:hover:border-white/[0.12]"
    >
      {/* Status gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-l ${
          statusKey === "overdue"
            ? "from-red-500/5 to-transparent"
            : statusKey === "completed"
              ? "from-emerald-500/5 to-transparent"
              : statusKey === "scheduled"
                ? "from-blue-500/5 to-transparent"
                : "from-slate-500/5 to-transparent"
        } pointer-events-none`}
        style={{
          backgroundSize: "20% 100%",
          backgroundPosition: "right",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 p-4">
        {/* Time */}
        <div className="sm:w-[140px] shrink-0">
          <p className="text-sm font-bold text-[var(--text-primary)] dark:text-white">
            {format(scheduledAt, "h:mm a")} - {format(endTime, "h:mm a")}
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            <span className="inline-flex items-center gap-1">
              <Clock size={10} /> 1 hour
            </span>
          </p>
        </div>

        {/* Status + Type */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${meta.lightClass} ${meta.darkClass}`}
          >
            {StatusIcon && <StatusIcon size={10} />}
            {!StatusIcon && (
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            )}
            {meta.label}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${typeMeta.lightClass} ${typeMeta.darkClass}`}
          >
            {typeMeta.label}
          </span>
        </div>

        {/* Client info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#132e35] to-[#0b1e22] flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
              {client?.profile_photo_url ? (
                <Image
                  src={client.profile_photo_url}
                  alt={client.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                (client?.name?.[0]?.toUpperCase() ?? "?")
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/clients/${checkin.client_id}`}
                className="text-sm font-semibold text-[var(--text-primary)] dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate flex items-center gap-1"
              >
                {client?.name ?? "Unknown Client"}
                <User
                  size={12}
                  className="text-[var(--text-tertiary)] shrink-0"
                />
              </Link>
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <span>ID #{checkin.client_id.slice(-4)}</span>
                {client?.email && (
                  <>
                    <span>·</span>
                    <span className="truncate">{client.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {statusKey === "scheduled" && (
            <>
              {checkin.type === "video" && checkin.meeting_link && (
                <a
                  href={checkin.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                >
                  <Video size={12} />
                  Start Meeting
                </a>
              )}
              {checkin.type === "call" && client?.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                >
                  <Phone size={12} />
                  Call Now
                </a>
              )}
              {checkin.type === "chat" && (
                <Link
                  href={`/clients/${checkin.client_id}?tab=messages`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                >
                  <MessageSquare size={12} />
                  Open Chat
                </Link>
              )}
              <button
                onClick={() => onReschedule(checkin)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] dark:text-white/60 border border-[var(--border)] dark:border-white/[0.08] rounded-lg hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04] transition-colors"
              >
                <RotateCcw size={12} />
                Reschedule
              </button>
              <button
                onClick={() => onCancel(checkin)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-300 border border-red-200 dark:border-red-500/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <Ban size={12} />
                Cancel
              </button>
            </>
          )}

          {statusKey === "overdue" && (
            <button
              onClick={() => onReschedule(checkin)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <RotateCcw size={12} />
              Reschedule
            </button>
          )}

          {statusKey === "completed" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-lg text-[11px]"
              >
                <Play size={12} fill="currentColor" /> View Recording
              </Button>
              <button className="p-1.5 text-[var(--text-tertiary)] dark:text-white/40 hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04] rounded-lg transition-colors">
                <X size={14} />
              </button>
            </>
          )}

          {statusKey === "cancelled" && (
            <button
              onClick={() => onReschedule(checkin)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] dark:text-white/60 border border-[var(--border)] dark:border-white/[0.08] rounded-lg hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04] transition-colors"
            >
              <RotateCcw size={12} />
              Reschedule
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════ */
export default function CheckinsPage() {
  const { data: checkins, isLoading: checkinsLoading } = useCheckins();
  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const createCheckin = useCreateCheckin();
  const updateCheckin = useUpdateCheckin();
  const updateStatus = useUpdateCheckinStatus();

  const clients = useMemo(() => clientsData?.data ?? [], [clientsData]);
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients],
  );
  const isLoading = checkinsLoading || clientsLoading;

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinMeeting | null>(
    null,
  );

  /* Filtering */
  const filtered = useMemo(() => {
    let list = checkins ?? [];
    list = filterCheckins(list, filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        const cl = clientMap.get(c.client_id);
        return (
          cl?.name?.toLowerCase().includes(q) ||
          c.type?.toLowerCase().includes(q) ||
          c.notes?.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [checkins, filter, search, clientMap]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  /* Counts for tabs */
  const counts = useMemo(() => {
    const list = checkins ?? [];
    return {
      all: list.length,
      scheduled: filterCheckins(list, "scheduled").length,
      overdue: filterCheckins(list, "overdue").length,
      completed: filterCheckins(list, "completed").length,
      cancelled: filterCheckins(list, "cancelled").length,
    };
  }, [checkins]);

  /* Handlers */
  const handleCreate = useCallback(
    async (data: Parameters<typeof createCheckin.mutateAsync>[0]) => {
      await createCheckin.mutateAsync(data);
    },
    [createCheckin],
  );

  const handleReschedule = useCallback((checkin: CheckinMeeting) => {
    setSelectedCheckin(checkin);
    setShowRescheduleModal(true);
  }, []);

  const handleCancel = useCallback(
    async (checkin: CheckinMeeting) => {
      if (
        !confirm(
          `Cancel this ${checkin.type} check-in with ${clientMap.get(checkin.client_id)?.name ?? "client"}?`,
        )
      )
        return;
      await updateStatus.mutateAsync({ id: checkin.id, status: "cancelled" });
    },
    [updateStatus, clientMap],
  );

  const handleRescheduleSubmit = useCallback(
    async (id: string, scheduled_at: string) => {
      await updateCheckin.mutateAsync({
        id,
        scheduled_at,
        status: "scheduled",
      });
    },
    [updateCheckin],
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[var(--bg-page)] dark:bg-[#0a1114] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-8 h-8 border-2 border-[var(--border)] dark:border-white/[0.08] border-t-brand-600 dark:border-t-[var(--energy)] rounded-full" />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--bg-page)] ">
        {/* Main Content */}
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <FilterBreadcrumb
              items={FILTER_TABS.map((t) => ({
                key: t.key,
                label: t.label,
                count: counts[t.key],
              }))}
              value={filter}
              onChange={setFilter}
            />
          </div>

          {/* Toolbar */}

          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-page)] dark:bg-white/[0.03] border border-[var(--border)] dark:border-white/[0.08] flex items-center justify-center mb-4">
                <CalendarDays
                  size={28}
                  className="text-[var(--text-tertiary)] dark:text-white/20"
                />
              </div>
              <p className="text-[15px] font-semibold text-[var(--text-primary)] dark:text-white">
                No check-ins found
              </p>
              <p className="text-sm text-[var(--text-tertiary)] dark:text-white/40 mt-1">
                {search.trim()
                  ? "Try a different search term"
                  : "Create your first check-in to get started"}
              </p>
              {!search.trim() && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 px-5 py-2.5 text-sm font-bold text-white rounded-md bg-brand-600 hover:bg-brand-700"
                >
                  Create Check-in
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map((group) => (
                <div key={group.key} className="flex gap-5">
                  {/* Date Pillar */}
                  <div className="hidden sm:flex flex-col items-center w-12 shrink-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] dark:text-white/30">
                      {group.dayName}
                    </span>
                    <span className="text-[20px] font-bold text-[var(--text-primary)] dark:text-white mt-0.5">
                      {group.dayNum}
                    </span>
                    <div className="w-px flex-1 bg-[var(--border)] dark:bg-white/[0.08] mt-2" />
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-3">
                    <div className="sm:hidden flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] dark:text-white/30">
                        {group.dayName}
                      </span>
                      <span className="text-[15px] font-bold text-[var(--text-primary)] dark:text-white">
                        {group.dayNum}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((checkin) => (
                        <CheckinCard
                          key={checkin.id}
                          checkin={checkin}
                          client={clientMap.get(checkin.client_id)}
                          onReschedule={handleReschedule}
                          onCancel={handleCancel}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modals */}
        <CreateCheckinModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          clients={clients}
          onCreate={handleCreate}
        />
        <RescheduleModal
          open={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          checkin={selectedCheckin}
          onReschedule={handleRescheduleSubmit}
        />
      </div>
    </DashboardLayout>
  );
}
