"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (e: unknown) {
      let msg = "Failed to send reset link. Please try again.";
      if (e && typeof e === "object") {
        const err = e as Record<string, unknown>;
        const resp = err.response as Record<string, unknown> | undefined;
        const respData = resp?.data as Record<string, unknown> | undefined;
        if (typeof respData?.message === "string") msg = respData.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full border border-white/[0.08] rounded-lg pl-10 pr-4 py-3 text-[13px] bg-white/[0.03] " +
    "text-white placeholder:text-white/25 " +
    "focus:outline-none focus:ring-1 focus:ring-[var(--energy)]/40 focus:border-[var(--energy)]/40 " +
    "disabled:opacity-40 transition-all duration-200 hover:border-white/[0.14]";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#060d10]">
      {/* Brand mark */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex items-center gap-2.5"
      >
        <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/10 bg-[#0a1114]">
          <img
            src="/img/360fit-bg.png"
            alt="360Fit"
            className="w-full h-full object-cover"
          />
        </div>
        <span
          className="text-sm font-bold text-white tracking-wider uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          360Fit
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[400px] mx-4"
      >
        <div className="bg-[#0c1d21]/90 backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--energy)]/25 to-transparent" />

          <div className="px-8 pt-8 pb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h1
                className="text-xl font-bold text-white text-center mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Reset Password
              </h1>
              <p className="text-[13px] text-white/40 text-center mb-6">
                {sent
                  ? "Check your inbox for the reset link."
                  : "Enter your email and we'll send you a link to reset your password."}
              </p>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <CheckCircle className="w-12 h-12 text-[var(--energy)] mx-auto mb-4" />
                  <p className="text-white/60 text-[13px] mb-6">
                    If an account exists for <strong className="text-white">{email}</strong>,
                    you will receive a password reset email shortly.
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-[var(--energy)] hover:text-[var(--energy-light)] font-semibold text-[13px] transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Back to Login
                  </Link>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={inputCls}
                        style={{ fontFamily: "var(--font-mono)" }}
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="w-full bg-[var(--energy)] text-[#0c1d21] font-bold text-[14px] py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Send Reset Link</span>
                  </motion.button>

                  <div className="text-center">
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center gap-1 text-[12px] text-white/40 hover:text-white/60 transition-colors"
                    >
                      <ArrowLeft size={12} />
                      Back to Login
                    </Link>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
