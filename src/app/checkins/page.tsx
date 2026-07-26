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
import {
  Search,
  CalendarDays,
  SlidersHorizontal,
  Plus,
  Bell,
  Clock,
  Globe,
  Hash,
  ChevronDown,
  X,
  RotateCcw,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  FileText,
  User,
  Link,
  Briefcase,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   Status & Filter Types
   ═══════════════════════════════════════════════════════════════════ */
type StatusFilter = "all" | "scheduled" | "overdue" | "completed" | "cancelled";

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "scheduled", label: "Scheduled" },
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_META: Record<
  string,
  {
    label: string;
    dot: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ElementType | null;
  }
> = {
  scheduled: {
    label: "Scheduled",
    dot: "bg-purple-500",
    bg: "bg-purple-50 dark:bg-purple-500/15",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-500/30",
    icon: null,
  },
  overdue: {
    label: "Overdue",
    dot: "bg-red-500",
    bg: "bg-red-50 dark:bg-red-500/15",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-500/30",
    icon: AlertTriangle,
  },
  completed: {
    label: "Completed",
    dot: "bg-brand-500",
    bg: "bg-brand-50 dark:bg-brand-500/15",
    text: "text-brand-700 dark:text-brand-300",
    border: "border-brand-200 dark:border-brand-500/30",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-gray-400",
    bg: "bg-gray-100 dark:bg-white/[0.04]",
    text: "text-gray-600 dark:text-white/50",
    border: "border-gray-200 dark:border-white/[0.08]",
    icon: XCircle,
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
   Create Check-in Modal
   ═══════════════════════════════════════════════════════════════════ */
function CreateCheckinModal({
  open,
  onClose,
  clients,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  onCreate: (data: {
    client_id: string;
    scheduled_at: string;
    type: "video" | "call" | "chat";
    meeting_link?: string;
    notes?: string;
  }) => Promise<void>;
}) {
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"video" | "call" | "chat">("video");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = useCallback(() => {
    setClientId("");
    setDate("");
    setTime("");
    setType("video");
    setMeetingLink("");
    setNotes("");
    setIsSubmitting(false);
    setCopied(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !date || !time) return;
    setIsSubmitting(true);
    try {
      await onCreate({
        client_id: clientId,
        scheduled_at: new Date(`${date}T${time}:00`).toISOString(),
        type,
        meeting_link: meetingLink || undefined,
        notes: notes || undefined,
      });
      handleClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleCopy = useCallback(() => {
    if (!meetingLink) return;
    navigator.clipboard.writeText(meetingLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [meetingLink]);

  /* Preview helpers */
  const selectedClient = clients.find((c) => c.id === clientId) ?? null;
  const scheduledAt = date && time ? parseISO(`${date}T${time}:00`) : null;
  const endTimeDate = scheduledAt
    ? new Date(scheduledAt.getTime() + 60 * 60 * 1000)
    : null;
  const dayName = scheduledAt ? format(scheduledAt, "EEE") : "";
  const dayNum = scheduledAt ? format(scheduledAt, "d") : "";
  const timeRange =
    scheduledAt && endTimeDate
      ? `${format(scheduledAt, "h:mm a")} - ${format(endTimeDate, "h:mm a")}`
      : "";
  const tz = scheduledAt
    ? format(scheduledAt, "z") === "Z"
      ? "GMT"
      : format(scheduledAt, "z")
    : "";
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const typeLabel =
    type === "video"
      ? "In-app Video Call"
      : type === "call"
        ? "Phone Call"
        : "Chat Session";

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-[var(--energy)]/20 " +
    "bg-[var(--bg-card)] dark:bg-white/[0.03] border border-[var(--border)] dark:border-white/[0.08] " +
    "text-[var(--text-primary)] dark:text-white placeholder:text-[var(--text-tertiary)] dark:placeholder:text-white/20";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[900px] bg-[var(--bg-card)] dark:bg-[#0a1114]/95 rounded-2xl shadow-2xl overflow-hidden border border-[var(--border)] dark:border-white/[0.08]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 dark:from-[var(--energy)] dark:to-[#bef264] flex items-center justify-center">
                  <CalendarDays
                    size={16}
                    className="text-white dark:text-[#0a1114]"
                  />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--text-primary)] dark:text-white">
                    Book a Check-in
                  </h2>
                  <p className="text-xs text-[var(--text-tertiary)] dark:text-white/40">
                    Schedule a new session with your client
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.06] rounded-full transition-colors"
              >
                <X
                  size={18}
                  className="text-[var(--text-tertiary)] dark:text-white/40"
                />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">
              {/* ═══════ Left: Form ═══════ */}
              <div className="flex-1 p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                {/* Date */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <CalendarDays
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] dark:text-white/30"
                    />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                  <div className="relative flex-1">
                    <Globe
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] dark:text-white/30"
                    />
                    <div
                      className={`${inputCls} pl-9 truncate text-[var(--text-tertiary)] dark:text-white/40 text-xs`}
                    >
                      {browserTz}
                    </div>
                  </div>
                </div>

                {/* Start / End */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-white/40 uppercase tracking-wider mb-1.5">
                      Start
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        className={inputCls}
                      />
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] dark:text-white/30 pointer-events-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-white/40 uppercase tracking-wider mb-1.5">
                      End
                    </label>
                    <div className="relative">
                      <div className={`${inputCls} opacity-70 pr-9`}>
                        {endTimeDate ? format(endTimeDate, "h:mm a") : "—"}
                      </div>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] dark:text-white/30 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Check-in option radios */}
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-white/40 uppercase tracking-wider mb-2">
                    Check-in option:
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { key: "video" as const, label: "In-app video call" },
                      { key: "call" as const, label: "Call with 3rd app" },
                      { key: "chat" as const, label: "Chat session" },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${type === opt.key ? "border-brand-500 dark:border-brand-400" : "border-[var(--border)] dark:border-white/20"}`}
                        >
                          {type === opt.key && (
                            <div className="w-2 h-2 rounded-full bg-brand-500 dark:bg-brand-400" />
                          )}
                        </div>
                        <span
                          className={`text-sm ${type === opt.key ? "text-[var(--text-primary)] dark:text-white font-medium" : "text-[var(--text-secondary)] dark:text-white/50"}`}
                        >
                          {opt.label}
                        </span>
                        <input
                          type="radio"
                          className="sr-only"
                          value={opt.key}
                          checked={type === opt.key}
                          onChange={() => setType(opt.key)}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Selected type detail card */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] dark:border-white/[0.08] bg-[var(--bg-page)] dark:bg-white/[0.02]">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 dark:bg-[var(--energy)]/20 flex items-center justify-center shrink-0">
                    <Link
                      size={18}
                      className="text-white dark:text-[var(--energy)]"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-white">
                      {typeLabel}
                    </p>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.jit.si/..."
                      className="w-full text-xs bg-transparent border-none p-0 focus:ring-0 text-[var(--text-secondary)] dark:text-white/60 placeholder:text-[var(--text-tertiary)] dark:placeholder:text-white/20 truncate"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!meetingLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border)] dark:border-white/[0.08] rounded-lg hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04] text-[var(--text-secondary)] dark:text-white/60 disabled:opacity-40 transition-colors"
                  >
                    <Copy size={12} />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Client */}
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-white/40 uppercase tracking-wider mb-2">
                    Client
                  </label>
                  {!selectedClient ? (
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      required
                      className={inputCls}
                    >
                      <option value="">Select a client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] dark:border-white/[0.08] bg-[var(--bg-page)] dark:bg-white/[0.02]">
                      <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[var(--border)] to-[var(--text-tertiary)] dark:from-white/10 dark:to-white/5 flex items-center justify-center text-sm font-bold text-[var(--text-secondary)] dark:text-white/60 overflow-hidden shrink-0">
                        {selectedClient.profile_photo_url ? (
                          <Image
                            src={selectedClient.profile_photo_url}
                            alt={selectedClient.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          (selectedClient.name?.[0]?.toUpperCase() ?? "?")
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-white truncate">
                          {selectedClient.name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] dark:text-white/40">
                          Client ID: #{selectedClient.id.slice(-4)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setClientId("")}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full text-[var(--text-tertiary)] dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-tertiary)] dark:text-white/40 uppercase tracking-wider mb-1.5">
                    <FileText size={12} /> Note
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write here..."
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] dark:text-white/60 bg-white dark:bg-transparent rounded-xl transition-colors border border-[var(--border)] dark:border-white/[0.08] hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !clientId || !date || !time}
                    className="flex-1 px-5 py-2.5 text-sm font-bold text-white dark:text-[#0a1114] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-br from-purple-600 to-purple-500 dark:from-[var(--energy)] dark:to-[#bef264]"
                  >
                    {isSubmitting ? "Saving..." : "Save Check-In"}
                  </button>
                </div>
              </div>

              {/* ═══════ Right: Preview ═══════ */}
              <div className="w-full md:w-[320px] bg-[var(--bg-page)] dark:bg-[#060d10] border-t md:border-t-0 md:border-l border-[var(--border)] dark:border-white/[0.06] p-6 space-y-6">
                {/* Date pillar + time */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-card)] dark:bg-white/[0.04] border border-[var(--border)] dark:border-white/[0.08] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)] dark:text-white/40">
                      {dayName || "—"}
                    </span>
                    <span className="text-[18px] font-bold text-[var(--text-primary)] dark:text-white leading-none mt-0.5">
                      {dayNum || "—"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[var(--text-primary)] dark:text-white truncate">
                      {timeRange || "Select a time"}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] dark:text-white/40 mt-0.5">
                      {tz ? `${tz} · 1 hour` : ""}
                    </p>
                  </div>
                </div>

                {/* Client */}
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] dark:text-white/30 mb-3">
                    <Briefcase size={13} /> Client
                  </p>
                  {selectedClient ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] dark:border-white/[0.08] bg-[var(--bg-card)] dark:bg-white/[0.02]">
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[var(--border)] to-[var(--text-tertiary)] dark:from-white/10 dark:to-white/5 flex items-center justify-center text-sm font-bold text-[var(--text-secondary)] dark:text-white/60 overflow-hidden shrink-0">
                          {selectedClient.profile_photo_url ? (
                            <Image
                              src={selectedClient.profile_photo_url}
                              alt={selectedClient.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            (selectedClient.name?.[0]?.toUpperCase() ?? "?")
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-white truncate flex items-center gap-1">
                            {selectedClient.name}
                            <span className="text-blue-500 dark:text-blue-400">
                              <User size={12} />
                            </span>
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)] dark:text-white/40">
                            Client ID: #{selectedClient.id.slice(-4)}
                          </p>
                          {selectedClient.email && (
                            <p className="text-xs text-purple-600 dark:text-[var(--energy)] truncate">
                              {selectedClient.email}
                            </p>
                          )}
                          {selectedClient.phone && (
                            <p className="text-xs text-[var(--text-secondary)] dark:text-white/60">
                              {selectedClient.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-tertiary)] dark:text-white/30 italic">
                      Select a client to see details
                    </p>
                  )}
                </div>

                {/* Interview Information */}
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] dark:text-white/30 mb-3">
                    <FileText size={13} /> Interview Information
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] dark:text-white/60">
                      <User
                        size={14}
                        className="text-[var(--text-tertiary)] dark:text-white/30 shrink-0"
                      />
                      <span className="text-[var(--text-tertiary)] dark:text-white/30">
                        Participant
                      </span>
                    </div>
                    {/* Participant skeleton bars */}
                    <div className="flex items-center gap-2 pl-6">
                      <div className="w-6 h-6 rounded-full bg-[var(--border)] dark:bg-white/[0.08] shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 rounded-full bg-[var(--border)] dark:bg-white/[0.06] w-2/3" />
                        <div className="flex gap-2">
                          <div className="h-1.5 rounded-full bg-[var(--border)] dark:bg-white/[0.06] w-1/3" />
                          <div className="h-1.5 rounded-full bg-[var(--border)] dark:bg-white/[0.06] w-1/4" />
                        </div>
                      </div>
                    </div>
                    {meetingLink && (
                      <div className="flex items-start gap-2 text-sm">
                        <Globe
                          size={14}
                          className="text-[var(--text-tertiary)] dark:text-white/30 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-tertiary)] dark:text-white/30 mb-0.5">
                            Location
                          </p>
                          <a
                            href={meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 dark:text-[var(--energy)] truncate hover:underline"
                          >
                            {meetingLink}
                          </a>
                        </div>
                      </div>
                    )}
                    {notes && (
                      <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)] dark:text-white/60">
                        <FileText
                          size={14}
                          className="text-[var(--text-tertiary)] dark:text-white/30 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-tertiary)] dark:text-white/30 mb-0.5">
                            Note
                          </p>
                          <p className="line-clamp-3">{notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
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
    "w-full px-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-[var(--energy)]/20 " +
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
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white dark:text-[#0a1114] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-br from-purple-600 to-purple-500 dark:from-[var(--energy)] dark:to-[#bef264]"
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
   Check-in Card
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

  const typeLabel =
    checkin.type === "video"
      ? "Video Call"
      : checkin.type === "call"
        ? "Phone Call"
        : "Chat Session";

  const typeColor =
    checkin.type === "video"
      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20"
      : checkin.type === "call"
        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20"
        : "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[var(--bg-card)] dark:bg-white/[0.02] rounded-2xl border border-[var(--border)] dark:border-white/[0.08] shadow-sm hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-shadow overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row">
        {/* ── Left: Client Name (prominent) ── */}
        <div className="flex-1 p-5 border-b lg:border-b-0 lg:border-r border-[var(--border)] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[var(--border)] to-[var(--text-tertiary)] dark:from-white/10 dark:to-white/5 flex items-center justify-center text-[16px] font-bold text-[var(--text-secondary)] dark:text-white/60 overflow-hidden shrink-0">
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
              <p className="text-[17px] font-bold text-[var(--text-primary)] dark:text-white truncate">
                {client?.name ?? "Unknown Client"}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[12px] text-[var(--text-tertiary)] dark:text-white/40">
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

          {checkin.notes && (
            <p className="mt-3 text-[12px] text-[var(--text-secondary)] dark:text-white/60 bg-[var(--bg-page)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.06] rounded-lg px-3 py-2">
              {checkin.notes}
            </p>
          )}
        </div>

        {/* ── Right: Time, Status & Actions ── */}
        <div className="flex-1 p-5">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-[15px] font-semibold text-[var(--text-primary)] dark:text-white">
              {format(scheduledAt, "h:mm a")} - {format(endTime, "h:mm a")}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}
            >
              {StatusIcon && <StatusIcon size={12} />}
              {!StatusIcon && (
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              )}
              {meta.label}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${typeColor}`}
            >
              {typeLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[12px] text-[var(--text-tertiary)] dark:text-white/40 mb-4">
            <span className="inline-flex items-center gap-1">
              <Hash size={11} />#{checkin.id.slice(-4)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Globe size={11} />
              {format(scheduledAt, "z") === "Z"
                ? "GMT"
                : format(scheduledAt, "z")}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={11} />1 hour
            </span>
          </div>

          <div className="flex items-center gap-2">
            {statusKey === "scheduled" && (
              <>
                {checkin.type === "video" && checkin.meeting_link && (
                  <a
                    href={checkin.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 text-[12px] font-semibold text-purple-700 dark:text-[var(--energy)] border border-purple-200 dark:border-[var(--energy)]/30 rounded-xl hover:bg-purple-50 dark:hover:bg-[var(--energy)]/10 transition-colors"
                  >
                    Start Meeting
                  </a>
                )}
                {checkin.type === "call" && client?.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="px-3.5 py-2 text-[12px] font-semibold text-purple-700 dark:text-[var(--energy)] border border-purple-200 dark:border-[var(--energy)]/30 rounded-xl hover:bg-purple-50 dark:hover:bg-[var(--energy)]/10 transition-colors"
                  >
                    Call Now
                  </a>
                )}
                <button
                  onClick={() => onCancel(checkin)}
                  className="px-3.5 py-2 text-[12px] font-semibold text-[var(--text-secondary)] dark:text-white/60 border border-[var(--border)] dark:border-white/[0.08] rounded-xl hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

            {statusKey === "overdue" && (
              <button
                onClick={() => onReschedule(checkin)}
                className="px-3.5 py-2 text-[12px] font-semibold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                Reschedule
              </button>
            )}

            {statusKey === "completed" && (
              <>
                <Button variant="secondary" size="sm" className="rounded-xl">
                  <Play size={13} fill="currentColor" /> View Recording
                </Button>
                <button className="p-2 text-[var(--text-tertiary)] dark:text-white/40 hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04] rounded-xl transition-colors">
                  <X size={16} />
                </button>
              </>
            )}

            {statusKey === "cancelled" && (
              <button
                onClick={() => onReschedule(checkin)}
                className="px-3.5 py-2 text-[12px] font-semibold text-[var(--text-secondary)] dark:text-white/60 border border-[var(--border)] dark:border-white/[0.08] rounded-xl hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04] transition-colors"
              >
                <RotateCcw size={13} className="inline mr-1" /> Reschedule
              </button>
            )}
          </div>
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
            <div className="w-8 h-8 border-2 border-[var(--border)] dark:border-white/[0.08] border-t-purple-500 dark:border-t-[var(--energy)] rounded-full" />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--bg-page)] dark:bg-[#0a1114]">
        {/* ═══════════ Top Navigation Bar ═══════════ */}
        <header className="sticky top-0 z-30 bg-[var(--bg-card)]/80 dark:bg-[#0a1114]/80 backdrop-blur-xl border-b border-[var(--border)] dark:border-white/[0.08]">
          <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 dark:from-[var(--energy)] dark:to-[#bef264] flex items-center justify-center">
                <CalendarDays
                  size={18}
                  className="text-white dark:text-[#0a1114]"
                />
              </div>
              <h1 className="text-[17px] font-bold text-[var(--text-primary)] dark:text-white">
                Check-ins
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] dark:text-white/30"
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 pl-9 pr-4 py-2 bg-[var(--bg-page)] dark:bg-white/[0.03] border border-[var(--border)] dark:border-white/[0.08] rounded-xl text-sm text-[var(--text-primary)] dark:text-white placeholder:text-[var(--text-tertiary)] dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-[var(--energy)]/20 focus:border-purple-400 dark:focus:border-[var(--energy)] transition-all"
                />
              </div>
              <button className="p-2 text-[var(--text-tertiary)] dark:text-white/40 hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04] rounded-xl transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 dark:from-[var(--energy)] dark:to-[#bef264] flex items-center justify-center text-sm font-bold text-white dark:text-[#0a1114]">
                V
              </div>
            </div>
          </div>
        </header>

        {/* ═══════════ Main Content ═══════════ */}
        <main className="max-w-[1400px] mx-auto px-6 py-6">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
            {FILTER_TABS.map((t) => {
              const count = counts[t.key];
              const active = filter === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all ${
                    active
                      ? "bg-[var(--text-primary)] dark:bg-white text-[var(--bg-card)] dark:text-[#0a1114] shadow-sm"
                      : "bg-[var(--bg-card)] dark:bg-white/[0.02] text-[var(--text-secondary)] dark:text-white/60 border border-[var(--border)] dark:border-white/[0.08] hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  {t.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-md text-[11px] font-bold ${
                      active
                        ? "bg-white/20 dark:bg-[#0a1114]/20 text-[var(--bg-card)] dark:text-[#0a1114]"
                        : t.key === "scheduled"
                          ? "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300"
                          : t.key === "overdue"
                            ? "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300"
                            : t.key === "completed"
                              ? "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300"
                              : "bg-[var(--bg-page)] dark:bg-white/[0.04] text-[var(--text-secondary)] dark:text-white/50"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md sm:hidden">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] dark:text-white/30"
              />
              <input
                type="text"
                placeholder="Search check-ins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-card)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.08] rounded-xl text-sm text-[var(--text-primary)] dark:text-white placeholder:text-[var(--text-tertiary)] dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-[var(--energy)]/20 focus:border-purple-400 dark:focus:border-[var(--energy)] transition-all"
              />
            </div>
            <div className="relative flex-1 max-w-md hidden sm:block">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] dark:text-white/30"
              />
              <input
                type="text"
                placeholder="Search check-ins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-card)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.08] rounded-xl text-sm text-[var(--text-primary)] dark:text-white placeholder:text-[var(--text-tertiary)] dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-[var(--energy)]/20 focus:border-purple-400 dark:focus:border-[var(--energy)] transition-all"
              />
            </div>

            <button className="flex items-center gap-2 px-3.5 py-2.5 bg-[var(--bg-card)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.08] rounded-xl text-sm font-medium text-[var(--text-secondary)] dark:text-white/60 hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04] transition-colors">
              <CalendarDays size={15} />
              Date added
              <ChevronDown size={14} />
            </button>

            <button className="flex items-center gap-2 px-3.5 py-2.5 bg-[var(--bg-card)] dark:bg-white/[0.02] border border-[var(--border)] dark:border-white/[0.08] rounded-xl text-sm font-medium text-[var(--text-secondary)] dark:text-white/60 hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.04] transition-colors">
              <SlidersHorizontal size={15} />
              Filter
            </button>

            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white dark:text-[#0a1114] rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/25 dark:hover:shadow-[var(--energy)]/25 bg-gradient-to-br from-purple-600 to-purple-500 dark:from-[var(--energy)] dark:to-[#bef264]"
            >
              <Plus size={16} />
              Create Check-in
            </button>
          </div>
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
                  className="mt-4 px-5 py-2.5 text-sm font-bold text-white dark:text-[#0a1114] rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 dark:from-[var(--energy)] dark:to-[#bef264]"
                >
                  Create Check-in
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map((group) => (
                <div key={group.key} className="flex gap-6">
                  {/* Date Pillar */}
                  <div className="hidden sm:flex flex-col items-center w-14 shrink-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] dark:text-white/30">
                      {group.dayName}
                    </span>
                    <span className="text-[22px] font-bold text-[var(--text-primary)] dark:text-white mt-0.5">
                      {group.dayNum}
                    </span>
                    <div className="w-px flex-1 bg-[var(--border)] dark:bg-white/[0.08] mt-2" />
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-3">
                    <div className="sm:hidden flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] dark:text-white/30">
                        {group.dayName}
                      </span>
                      <span className="text-[15px] font-bold text-[var(--text-primary)] dark:text-white">
                        {group.dayNum}
                      </span>
                    </div>
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
