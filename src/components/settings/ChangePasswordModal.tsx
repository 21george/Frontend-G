"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const reset = useCallback(() => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setMessage(null);
  }, []);

  const handleClose = useCallback(() => {
    if (saving) return;
    reset();
    onClose();
  }, [saving, reset, onClose]);

  const handleSubmit = useCallback(async () => {
    if (next.length < 8) {
      setMessage({ type: "err", text: "At least 8 characters" });
      return;
    }
    if (next !== confirm) {
      setMessage({ type: "err", text: "Passwords do not match" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const api = (await import("@/lib/api")).default;
      await api.put("/coach/profile/password", {
        current_password: current,
        new_password: next,
      });
      setMessage({ type: "ok", text: "Password changed" });
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err: any) {
      setMessage({
        type: "err",
        text: err?.response?.data?.message ?? "Failed",
      });
    } finally {
      setSaving(false);
    }
  }, [current, next, confirm, handleClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-md rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[var(--btn-bg)] flex items-center justify-center rounded-lg">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Change Password
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Update your password securely
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                  Current Password
                </label>
                <input
                  type="password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  placeholder="Enter current password"
                  className="input mt-1.5 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                  New Password
                </label>
                <input
                  type="password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input mt-1.5 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  className="input mt-1.5 rounded-lg"
                />
              </div>

              {message && (
                <div
                  className={`p-3 text-sm rounded-lg ${
                    message.type === "ok"
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  onClick={handleClose}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-4 py-2 bg-[var(--btn-bg)] text-white text-sm font-medium hover:bg-[var(--btn-hover)] transition-colors disabled:opacity-50 rounded-lg inline-flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Saving…" : "Update Password"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
