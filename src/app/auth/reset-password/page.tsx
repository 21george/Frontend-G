"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const type = searchParams.get("type") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        token,
        password,
        type,
        email,
      });
      setSuccess(true);
    } catch (e: unknown) {
      let msg = "Failed to reset password. Please try again.";
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

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060d10]">
        <Loader2 className="w-8 h-8 text-[var(--energy)] animate-spin" />
      </div>
    );
  }

  if (!token || !type) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060d10] px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-white mb-2">Invalid Link</h1>
          <p className="text-white/60 text-[13px] mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/auth/forgot-password"
            className="text-[var(--energy)] hover:text-[var(--energy-light)] font-semibold text-[13px]"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

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
                {success ? "Password Updated" : "Create New Password"}
              </h1>
              <p className="text-[13px] text-white/40 text-center mb-6">
                {success
                  ? "Your password has been reset successfully."
                  : "Enter a new password for your account."}
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

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <CheckCircle className="w-12 h-12 text-[var(--energy)] mx-auto mb-4" />
                  <p className="text-white/60 text-[13px] mb-6">
                    You can now log in with your new password.
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-block w-full bg-[var(--energy)] text-[#0c1d21] font-bold text-[14px] py-3 rounded-lg text-center transition-opacity hover:opacity-90"
                    style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}
                  >
                    Go to Login
                  </Link>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className={`${inputCls} pr-10`}
                        style={{ fontFamily: "var(--font-mono)" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className={inputCls}
                        style={{ fontFamily: "var(--font-mono)" }}
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || password.length < 8 || confirmPassword.length < 8}
                    className="w-full bg-[var(--energy)] text-[#0c1d21] font-bold text-[14px] py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Reset Password</span>
                  </motion.button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#060d10]">
          <Loader2 className="w-8 h-8 text-[var(--energy)] animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
