"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api";
import { staffApi } from "@/lib/api/services/staff";
import { useAuthStore } from "@/store/auth";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});
type LoginValues = z.infer<typeof loginSchema>;

/* ── Staggered entrance variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function StaffLoginPage() {
  const router = useRouter();
  const setStaff = useAuthStore((s) => s.setStaff);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isStaff = useAuthStore((s) => s.isStaff);
  // Always start false; set true after effect runs so server/client initial HTML match.
  const [isHydrated, setIsHydrated] = useState(false);

  // Track whether the user was already authenticated when this page mounted.
  // Prevents the post-login useEffect from overriding redirects performed
  // by the login handler (e.g. /staff/complete-profile).
  const wasAlreadyAuthenticated = useRef<boolean | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isHydrated) return;
    if (useAuthStore.persist?.hasHydrated?.()) {
      setIsHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setIsHydrated(true),
    );
    return unsub;
  }, [isHydrated]);

  useEffect(() => {
    if (isHydrated && wasAlreadyAuthenticated.current === null) {
      wasAlreadyAuthenticated.current = isAuthenticated && isStaff;
    }
  }, [isHydrated, isAuthenticated, isStaff]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && isStaff && wasAlreadyAuthenticated.current === true) {
      router.replace("/dashboard");
    }
  }, [isHydrated, isAuthenticated, isStaff, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060d10]">
        <Loader2 className="w-8 h-8 text-energy animate-spin" />
      </div>
    );
  }
  if (isAuthenticated && isStaff) return null;

  const handleLogin = async (data: LoginValues) => {
    setError(null);
    setIsLoading(true);
    try {
      // Log the exact request being made
      if (process.env.NODE_ENV !== "production") {
        console.log("[STAFF LOGIN] Sending request to:", "/auth/staff/login");
        console.log("[STAFF LOGIN] Payload:", { email: data.email, pwLen: data.password.length });
      }

      const res = await apiClient.post("/auth/staff/login", data);

      if (process.env.NODE_ENV !== "production") {
        console.log("[STAFF LOGIN] Success:", res.data);
      }

      const { staff, access_token, setup_complete } = res.data?.data || {};
      if (!staff || !access_token)
        throw new Error("Invalid response from server");

      // Fetch fresh profile to resolve profile_photo to a current presigned URL.
      // The login response may contain a stale or missing photo URL; this ensures
      // the avatar is immediately available and valid.
      let freshStaff = staff;
      try {
        const profile = await staffApi.getProfile();
        if (profile) {
          freshStaff = { ...staff, ...profile };
        }
      } catch {
        // Non-fatal: fall back to the login response payload
      }

      setStaff(freshStaff, access_token);
      if (setup_complete === false) {
        router.push("/staff/complete-profile");
      } else {
        router.push("/dashboard");
      }
    } catch (e: unknown) {
      let msg = "Login failed. Please try again.";
      let rawResponse: unknown = null;

      if (e && typeof e === "object") {
        const err = e as Record<string, unknown>;
        const resp = err.response as Record<string, unknown> | undefined;
        rawResponse = resp?.data ?? null;

        if (
          err.code === "ECONNABORTED" ||
          (typeof err.message === "string" && err.message.includes("timeout"))
        ) {
          msg = "Login request timed out. Please check your network connection.";
        } else if (err.message === "Network Error") {
          msg = "Cannot connect to the server. Please check your network connection.";
        } else {
          const respData = resp?.data as unknown;
          if (respData && typeof (respData as Record<string, unknown>).message === "string") {
            msg = (respData as Record<string, unknown>).message as string;
          } else if (typeof respData === "string") {
            msg = respData.slice(0, 200);
          } else if (typeof err.message === "string") {
            msg = err.message;
          }
        }
      }

      // Always log diagnostic info in dev
      if (process.env.NODE_ENV !== "production") {
        console.error("[STAFF LOGIN ERROR]", {
          message: msg,
          rawResponse,
          fullError: e,
        });
      }

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full border border-white/[0.08] rounded-lg pl-9 pr-4 py-[11px] text-[13px] bg-white/[0.03] " +
    "text-white placeholder:text-white/20 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus:ring-[#a3e635]/40 focus:border-[#a3e635]/40 " +
    "disabled:opacity-40 transition-all duration-200 hover:border-white/[0.12]";

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/img/360fit-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[#060d10]/85" aria-hidden />

      {/* Breathing radial glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none blur-[100px]"
        style={{
          background: "radial-gradient(circle, #a3e635 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[340px] mx-4 bg-[#0a1114]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl px-8 py-9 shadow-2xl shadow-black/50"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="text-center mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden ring-1 ring-white/10">
                <img
                  src="/img/360fit-bg.png"
                  alt="360Fit"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h1
              className="text-[22px] font-bold text-white tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Staff Login
            </h1>
            <p className="text-[12.5px] text-white/40 mt-1">
              Sign in to your team account
            </p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] text-center overflow-hidden"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={form.handleSubmit(handleLogin)}
            className="space-y-3"
            noValidate
          >
            <motion.div variants={itemVariants}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/20" />
                <input
                  type="email"
                  placeholder="Email address"
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

            <motion.div variants={itemVariants}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/20" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="current-password"
                  {...form.register("password")}
                  className={`${inputCls} pr-10`}
                  style={{ fontFamily: "var(--font-mono)" }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
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
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#a3e635] hover:bg-[#bef264] active:bg-[#8bc52f] text-[#0a1114] font-bold text-[14px] py-[11px] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                style={{
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.05em",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>LOGIN</span>
              </motion.button>
            </motion.div>
          </form>

          <motion.p
            variants={itemVariants}
            className="text-center text-[12px] text-white/30 mt-5"
          >
            Back to{" "}
            <Link
              href="/auth/login"
              className="text-[#a3e635] hover:text-[#bef264] font-semibold transition-colors"
            >
              Coach Login
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
