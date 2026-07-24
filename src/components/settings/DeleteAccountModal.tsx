"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ open, onClose }: Props) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setConfirmText("");
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    reset();
    onClose();
  }, [loading, reset, onClose]);

  const handleDelete = useCallback(async () => {
    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { settingsApi } = await import("@/lib/api/services/settings");
      await settingsApi.deleteAccount();
      useAuthStore.getState().logout();
      window.location.href = "/login";
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to delete account");
      setLoading(false);
    }
  }, [confirmText]);

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
            className="relative bg-[var(--bg-card)] border border-red-200 dark:border-red-900/30 w-full max-w-md rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 flex items-center justify-center rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Delete Account
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  This action is irreversible
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                To confirm deletion, type{" "}
                <strong className="text-[var(--text-primary)]">DELETE</strong>{" "}
                below.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                disabled={loading}
                className="input rounded-lg"
              />

              {error && (
                <div className="p-3 text-sm rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50 rounded-lg inline-flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Deleting…" : "Delete Account"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
