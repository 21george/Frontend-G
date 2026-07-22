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

/* ── Ambient floating particles ── */
function FloatingParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 8 + 12,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#a3e635]"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            filter: "blur(0.5px)",
          }}
          animate={{
            y: [0, -40, 20, -30, 0],
            x: [0, 15, -10, 20, 0],
            opacity: [0.1, 0.35, 0.15, 0.4, 0.1],
            scale: [1, 1.3, 0.8, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated gradient ring behind logo ── */
function LogoRing() {
  return (
    <motion.div
      className="absolute inset-0 rounded-xl"
      animate={{
        boxShadow: [
          "0 0 0 0px rgba(163,230,53,0)",
          "0 0 0 4px rgba(163,230,53,0.15)",
          "0 0 0 0px rgba(163,230,53,0)",
        ],
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

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
  const [isHydrated, setIsHydrated] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setIsHydrated(true),
    );
    return unsub;
  }, []);

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
          <Loader2 className="w-8 h-8 text-[#a3e635]" />
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
      if (!coach || !access_token)
        throw new Error("Invalid response from server");
      setCoach(coach, access_token);

      if (coach.subscription_status === "pending" && setup_token) {
        setSetupToken(setup_token, coach.id);
        router.push(
          `/subscription/select-plan?token=${encodeURIComponent(setup_token)}&coach_id=${coach.id}`,
        );
        return;
      }
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
    "w-full border border-white/[0.08] rounded-lg pl-9 pr-4 py-[11px] text-[13px] bg-white/[0.03] " +
    "text-white placeholder:text-white/20 " +
    "focus:outline-none focus:ring-1 focus:ring-[#a3e635]/40 focus:border-[#a3e635]/40 " +
    "disabled:opacity-40 transition-all duration-200 hover:border-white/[0.12]";

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

      <div
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/img/360fit-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Heavy dark overlay */}
        <div className="absolute inset-0 bg-[#060d10]/85" aria-hidden />

        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
          }}
          aria-hidden
        />

        {/* Floating particles */}
        <FloatingParticles />

        {/* Breathing radial glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none blur-[100px]"
          style={{ background: "radial-gradient(circle, #a3e635 0%, transparent 70%)" }}
          animate={{
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />

        {/* ── Login card ── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[340px] mx-4 bg-[#0a1114]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl px-8 py-9 shadow-2xl shadow-black/50"
        >
          {/* Top sheen with shimmer */}
          <motion.div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a3e635]/30 to-transparent"
            animate={{
              backgroundPosition: ["0%", "200%"],
            }}
            style={{ backgroundSize: "200% 100%" }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Logo */}
            <motion.div variants={itemVariants} className="flex items-center justify-center mb-1">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden ring-1 ring-white/10">
                <LogoRing />
                <motion.img
                  src="/img/360fit-bg.png"
                  alt="360Fit"
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={itemVariants}
              className="text-[22px] font-bold text-white text-center mt-5 mb-1 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Welcome Back
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-[12.5px] text-white/40 text-center mb-7"
            >
              Don&apos;t have an account yet?{" "}
              <Link
                href="/auth/register"
                className="text-[#a3e635] hover:text-[#bef264] font-semibold transition-colors"
              >
                Sign up
              </Link>
            </motion.p>

            {/* Error banner */}
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

            {/* Form */}
            <form
              onSubmit={form.handleSubmit(handleLogin)}
              className="space-y-3"
              noValidate
            >
              {/* Email */}
              <motion.div variants={itemVariants}>
                <div className="relative">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: 0 }}
                  >
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/20" />
                  </motion.div>
                  <input
                    type="email"
                    placeholder="email address"
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
                  <motion.button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                    whileTap={{ scale: 0.85 }}
                  >
                    <AnimatePresence mode="wait">
                      {showPassword ? (
                        <motion.div
                          key="eyeoff"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.15 }}
                        >
                          <EyeOff size={14} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="eye"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Eye size={14} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
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

              {/* Login button */}
              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#a3e635] hover:bg-[#bef264] active:bg-[#8bc52f] text-[#0a1114] font-bold text-[14px] py-[11px] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1 overflow-hidden relative"
                  style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {/* Button shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={isLoading ? { x: "200%" } : { x: "-100%" }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                  {isLoading && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-4 h-4" />
                    </motion.div>
                  )}
                  <span className="relative z-10">LOGIN</span>
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
