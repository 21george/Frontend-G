"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAllClients } from "@/lib/hooks";
import { useCreateCoachingSession } from "@/lib/hooks";
import { ArrowLeft, CalendarDays, Clock, User, Video } from "lucide-react";
import type { Client } from "@/types";

/* ─────────────────────────────────────────────────────────────────────────── */
export default function NewCoachingSessionPage() {
  const router = useRouter();
  const { data: clients = [], isLoading: clientsLoading } = useAllClients();
  const createSession = useCreateCoachingSession();

  const [form, setForm] = useState({
    client_id: "",
    title: "",
    description: "",
    agenda: "",
    duration_min: 60,
    scheduled_at: "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.client_id) return setError("Please select a client.");
    if (!form.title.trim()) return setError("Session title is required.");
    if (!form.scheduled_at) return setError("Scheduled date/time is required.");
    if (form.duration_min < 5)
      return setError("Duration must be at least 5 minutes.");

    try {
      const res = await createSession.mutateAsync({
        client_id: form.client_id,
        title: form.title.trim(),
        description: form.description.trim(),
        agenda: form.agenda.trim(),
        duration_min: Number(form.duration_min),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      });
      const id = (res as { data: { data: { id: string } } }).data?.data?.id;
      router.push(id ? `/coaching-sessions/${id}` : "/coaching-sessions");
    } catch {
      setError("Failed to create session. Please try again.");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sessions
        </button>

        {/* Title */}
        <div>
          <div className="h-11 w-11 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-4">
            <Video className="h-5 w-5 text-cyan-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            New 1-on-1 Session
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Schedule a private video coaching session with a client.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Client */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              <User className="h-3.5 w-3.5 inline mr-1.5 opacity-70" />
              Client
            </label>
            <select
              value={form.client_id}
              onChange={(e) => set("client_id", e.target.value)}
              disabled={clientsLoading}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <option value="">
                {clientsLoading ? "Loading clients…" : "Select a client…"}
              </option>
              {clients.map((c: Client) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Session Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Monthly Progress Review"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Description{" "}
              <span className="text-[var(--text-tertiary)] font-normal">
                (optional)
              </span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief overview of the session…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none"
            />
          </div>

          {/* Agenda */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Agenda{" "}
              <span className="text-[var(--text-tertiary)] font-normal">
                (optional)
              </span>
            </label>
            <textarea
              rows={4}
              value={form.agenda}
              onChange={(e) => set("agenda", e.target.value)}
              placeholder={
                "1. Warm-up review\n2. Progress assessment\n3. Nutrition check-in\n4. Set next week's goals"
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none"
            />
          </div>

          {/* Date / Duration row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                <CalendarDays className="h-3.5 w-3.5 inline mr-1.5 opacity-70" />
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => set("scheduled_at", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                <Clock className="h-3.5 w-3.5 inline mr-1.5 opacity-70" />
                Duration (minutes)
              </label>
              <select
                value={form.duration_min}
                onChange={(e) => set("duration_min", Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                {[15, 30, 45, 60, 75, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-sm font-medium text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSession.isPending}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-lg shadow-cyan-500/20"
            >
              {createSession.isPending ? "Scheduling…" : "Schedule Session"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
