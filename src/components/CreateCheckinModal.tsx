"use client";

import { useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import type { Client } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  CalendarDays,
  X,
  Globe,
  ChevronDown,
  Copy,
  FileText,
  User,
  Link as LinkIcon,
  Briefcase,
} from "lucide-react";

interface CreateCheckinModalProps {
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
}

export function CreateCheckinModal({
  open,
  onClose,
  clients,
  onCreate,
}: CreateCheckinModalProps) {
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
    "w-full px-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-700/20 dark:focus:ring-[var(--energy)]/20 " +
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center">
                  <CalendarDays size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--text-primary)] dark:text-white">
                    Create Check-in
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
                <X size={18} className="text-[var(--text-tertiary)] dark:text-white/40" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">
              {/* Left: Form */}
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
                  <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
                    <LinkIcon size={18} className="text-white" />
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
                    className="flex-1 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-brand-600 hover:bg-brand-700"
                  >
                    {isSubmitting ? "Saving..." : "Save Check-In"}
                  </button>
                </div>
              </div>

              {/* Right: Preview */}
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
                            <p className="text-xs text-brand-600 dark:text-brand-300 truncate">
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
                      <User size={14} className="text-[var(--text-tertiary)] dark:text-white/30 shrink-0" />
                      <span className="text-[var(--text-tertiary)] dark:text-white/30">Participant</span>
                    </div>
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
                        <Globe size={14} className="text-[var(--text-tertiary)] dark:text-white/30 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-tertiary)] dark:text-white/30 mb-0.5">Location</p>
                          <a
                            href={meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 dark:text-brand-300 truncate hover:underline"
                          >
                            {meetingLink}
                          </a>
                        </div>
                      </div>
                    )}
                    {notes && (
                      <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)] dark:text-white/60">
                        <FileText size={14} className="text-[var(--text-tertiary)] dark:text-white/30 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-tertiary)] dark:text-white/30 mb-0.5">Note</p>
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
