"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTeamMeetings, useCreateTeamMeeting, useUpdateTeamMeetingStatus } from "@/lib/hooks";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { TeamMeeting } from "@/types";
import { motion } from "framer-motion";
import { FilterPills } from "@/components/ui/FilterPills";
import {
  Plus,
  CalendarDays,
  Users,
  Video,
  Phone,
  MessageCircle,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

type StatusFilter = "all" | "scheduled" | "completed" | "cancelled";

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const TYPE_ICON: Record<string, React.ElementType> = {
  video: Video,
  call: Phone,
  chat: MessageCircle,
  in_person: Briefcase,
};

const STATUS_META: Record<
  string,
  { label: string; lightClass: string; darkClass: string }
> = {
  scheduled: {
    label: "Scheduled",
    lightClass: "bg-blue-50 text-blue-700 border border-blue-200/60",
    darkClass: "dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  },
  completed: {
    label: "Completed",
    lightClass: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    darkClass: "dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  },
  cancelled: {
    label: "Cancelled",
    lightClass: "bg-slate-100 text-slate-600 border border-slate-200",
    darkClass: "dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700",
  },
};

export default function TeamMeetingsPage() {
  const { data: meetings = [], isLoading } = useTeamMeetings();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = meetings.filter((m) => {
    if (filter === "all") return true;
    return m.status === filter;
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--bg-page)] px-6 sm:px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] dark:text-[#FAFAFA]">
              Team Meetings
            </h1>
            <p className="text-sm text-[var(--text-secondary)] dark:text-[#FAFAFA]/50">
              Schedule and manage team meetings
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#132E35] text-white text-sm font-medium hover:bg-[#1a3d45] transition-colors"
          >
            <Plus size={16} />
            Schedule Meeting
          </button>
        </div>

        <div className="mb-4">
          <FilterPills
            filters={FILTER_TABS.map((t) => ({ key: t.key, label: t.label }))}
            activeFilter={filter}
            onFilterChange={(key) => setFilter(key as StatusFilter)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] p-5 animate-pulse"
              >
                <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded mb-3" />
                <div className="h-3 w-48 bg-slate-100 dark:bg-white/[0.06] rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)] dark:text-[#FAFAFA]/30">
            <CalendarDays size={32} className="mb-3" />
            <p className="text-sm">No team meetings found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((meeting, i) => (
              <MeetingCard key={meeting.id} meeting={meeting} index={i} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateMeetingModal onClose={() => setShowCreate(false)} />
      )}
    </DashboardLayout>
  );
}

function MeetingCard({ meeting, index }: { meeting: TeamMeeting; index: number }) {
  const updateStatus = useUpdateTeamMeetingStatus();
  const dt = meeting.scheduled_at ? parseISO(meeting.scheduled_at) : null;
  const Icon = TYPE_ICON[meeting.type] ?? MessageCircle;
  const statusMeta = STATUS_META[meeting.status] ?? STATUS_META.scheduled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[var(--bg-subtle)] dark:bg-[#FAFAFA]/[0.05]">
            <Icon size={18} className="text-[var(--text-secondary)] dark:text-[#FAFAFA]/60" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">
              {meeting.title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] dark:text-[#FAFAFA]/50 mt-0.5">
              {dt ? format(dt, "EEE, MMM d · h:mm a") : "—"} ·{" "}
              {meeting.duration_min ? `${meeting.duration_min} min` : "No duration"}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <Users size={12} className="text-[var(--text-tertiary)]" />
              <span className="text-xs text-[var(--text-secondary)]">
                {meeting.participants.map((p) => p.name).join(", ")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${statusMeta.lightClass} ${statusMeta.darkClass}`}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>

      {meeting.status === "scheduled" && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border)] dark:border-white/[0.06]">
          <button
            onClick={() => updateStatus.mutate({ id: meeting.id, status: "completed" })}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            <CheckCircle2 size={14} /> Mark completed
          </button>
          <button
            onClick={() => updateStatus.mutate({ id: meeting.id, status: "cancelled" })}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-600 dark:text-slate-400"
          >
            <XCircle size={14} /> Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
}

function CreateMeetingModal({ onClose }: { onClose: () => void }) {
  const createMeeting = useCreateTeamMeeting();
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [type, setType] = useState<"call" | "video" | "chat" | "in_person">("video");
  const [durationMin, setDurationMin] = useState("30");
  const [participantIds, setParticipantIds] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ids = participantIds.split(",").map((id) => id.trim()).filter(Boolean);
    if (!title || !scheduledAt || ids.length === 0) return;

    createMeeting.mutate(
      {
        title,
        scheduled_at: scheduledAt,
        type,
        duration_min: parseInt(durationMin, 10) || undefined,
        participant_ids: ids,
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] w-full max-w-md p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold text-[var(--text-primary)] dark:text-[#FAFAFA] mb-4">
          Schedule Team Meeting
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
              placeholder="Weekly Team Sync"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Scheduled At
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
              >
                <option value="video">Video</option>
                <option value="call">Call</option>
                <option value="chat">Chat</option>
                <option value="in_person">In Person</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
                min={1}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Participant IDs (comma-separated)
            </label>
            <input
              type="text"
              value={participantIds}
              onChange={(e) => setParticipantIds(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
              placeholder="staff-id-1, staff-id-2"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMeeting.isPending}
              className="px-4 py-2 bg-[#132E35] text-white text-sm font-medium hover:bg-[#1a3d45] disabled:opacity-50"
            >
              {createMeeting.isPending ? "Scheduling..." : "Schedule Meeting"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
