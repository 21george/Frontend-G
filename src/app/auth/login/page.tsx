"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useSubscriptionStore } from "@/store/subscription";
import { SubscriptionAlertModal } from "@/components/subscription/SubscriptionAlertModal";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});
type LoginValues = z.infer<typeof loginSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function LoginPage() {
  const router = useRouter();
  const setCoach = useAuthStore((s) => s.setCoach);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setSetupToken = useSubscriptionStore((s) => s.setSetupToken);

  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAlert, setPendingAlert] = useState<
    "update_payment" | "resubscribe" | "renew_subscription" | null
  >(null);
  const [isHydrated, setIsHydrated] = useState(() =>
    typeof window !== "undefined" && useAuthStore.persist?.hasHydrated?.(),
  );

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isHydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setIsHydrated(true),
    );
    return unsub;
  }, [isHydrated]);

  useEffect(() => {
    if (isHydrated && isAuthenticated) router.replace("/dashboard");
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060d10]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-[var(--energy)]" />
        </motion.div>
      </div>
    );
  }
  if (isAuthenticated) return null;

  const handleLogin = async (data: LoginValues) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await apiClient.post("/auth/coach/login", data);
      const { coach, access_token, setup_token } = res.data?.data || {};
      if (!coach) throw new Error("Invalid response from server");

      if (coach.subscription_status === "pending") {
        if (!setup_token) throw new Error("Invalid response from server");
        setSetupToken(setup_token, coach.id);
        router.push(
          `/subscription/select-plan?token=${encodeURIComponent(setup_token)}&coach_id=${coach.id}`,
        );
        return;
      }

      if (!access_token) throw new Error("Invalid response from server");
      setCoach(coach, access_token);

      if (coach.subscription_alert === "select_plan") {
        if (setup_token) {
          setSetupToken(setup_token, coach.id);
          router.push(
            `/subscription/select-plan?token=${encodeURIComponent(setup_token)}&coach_id=${coach.id}`,
          );
        } else {
          router.push("/subscription/select-plan");
        }
        return;
      }
      if (coach.subscription_alert) {
        setPendingAlert(coach.subscription_alert);
        return;
      }
      router.push("/dashboard");
    } catch (e: unknown) {
      let msg = "Login failed. Please try again.";
      if (e && typeof e === "object") {
        const err = e as Record<string, unknown>;
        if (
          err.code === "ECONNABORTED" ||
          (typeof err.message === "string" && err.message.includes("timeout"))
        ) {
          msg =
            "Login request timed out. Please check your network connection.";
        } else if (err.message === "Network Error") {
          msg =
            "Cannot connect to the server. Please check your network connection.";
        } else {
          const resp = err.response as Record<string, unknown> | undefined;
          const respData = resp?.data as Record<string, unknown> | undefined;
          if (typeof respData?.message === "string") msg = respData.message;
        }
      }
      setError(msg);
      if (process.env.NODE_ENV !== "production") {
        console.error("Login error:", e);
      }
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
    <>
      {pendingAlert && (
        <SubscriptionAlertModal
          alert={pendingAlert}
          onClose={() => {
            setPendingAlert(null);
            router.push("/dashboard");
          }}
        />
      )}

      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0c1d21]">
        {/* Brand mark above the card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
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

        {/* ── Login card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[400px] mx-4"
        >
          <div className="bg-[#0c1d21]/90 backdrop-blur-xl overflow-hidden">
            {/* Top sheen */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--energy)]/25 to-transparent"
            />

            <div className="px-8 pt-8 pb-8">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Title */}
                <motion.h1
                  variants={itemVariants}
                  className="text-xl font-bold text-white text-center mb-6 tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Welcome Back!
                </motion.h1>

                {/* Error banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -6 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center overflow-hidden"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form
                  onSubmit={form.handleSubmit(handleLogin)}
                  className="space-y-4"
                  noValidate
                >
                  {/* Email */}
                  <motion.div variants={itemVariants}>
                    <label className="block text-xs font-medium text-white/60 mb-1.5">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        {...form.register("email")}
                        className={inputCls}
                        style={{ fontFamily: "var(--font-mono)" }}
                      />
                    </div>
                    <AnimatePresence>
                      {form.formState.errors.email && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-1 text-[11px] text-red-400"
                        >
                          {form.formState.errors.email.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Password */}
                  <motion.div variants={itemVariants}>
                    <label className="block text-xs font-medium text-white/60 mb-1.5">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...form.register("password")}
                        className={`${inputCls} pr-10`}
                        style={{ fontFamily: "var(--font-mono)" }}
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        <AnimatePresence mode="wait">
                          {showPassword ? (
                            <motion.div
                              key="eyeoff"
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.6 }}
                              transition={{ duration: 0.12 }}
                            >
                              <EyeOff size={15} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="eye"
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.6 }}
                              transition={{ duration: 0.12 }}
                            >
                              <Eye size={15} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                    <AnimatePresence>
                      {form.formState.errors.password && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-1 text-[11px] text-red-400"
                        >
                          {form.formState.errors.password.message}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Forgot password */}
                    <div className="flex justify-end mt-1.5">
                      <Link
                        href="/auth/forgot-password"
                        className="text-[11px] text-[var(--energy)]/70 hover:text-[var(--energy)] transition-colors"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  </motion.div>

                  {/* Login button */}
                  <motion.div variants={itemVariants} className="pt-1">
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[var(--energy)] text-[#0c1d21] border-r-orange-300 font-bold text-[14px] py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden relative hover:shadow-[0_0_20px_rgba(163,230,53,0.25)]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.04em",
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      {isLoading && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      <span className="relative z-10">Login</span>
                    </motion.button>
                  </motion.div>
                </form>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Footer below the card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-5 text-center"
        >
          <p className="text-xs text-white/30">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-[var(--energy)]/80 hover:text-[var(--energy)] transition-colors font-semibold"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}
