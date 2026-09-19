"use client";

import { Suspense, useSyncExternalStore, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Loader2, CheckCircle } from "lucide-react";
import { staffApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

// SSR-safe hydration guard: returns false during server render, true on client.
function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const acceptSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Name must be at least 2 characters." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
type AcceptValues = z.infer<typeof acceptSchema>;

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

/* ── Inner component that uses useSearchParams (wrapped in Suspense) ── */
function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const setStaff = useAuthStore((s) => s.setStaff);

  const isClient = useIsClient();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<AcceptValues>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { name: "", password: "", confirmPassword: "" },
  });

  // On mount (client-side only), flag a missing token as an error.
  // We avoid useEffect here because the project's ESLint rule forbids
  // synchronous setState inside effects.
  if (isClient && !token && error === null) {
    setError("Invalid or missing invite token.");
  }

  const handleSubmit = async (data: AcceptValues) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await staffApi.acceptInvite({
        token,
        name: data.name,
        password: data.password,
      });
      const { staff, access_token } = res.data || {};
      if (!staff || !access_token) {
        throw new Error("Invite accepted but no credentials were returned.");
      }
      setStaff(staff, access_token);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (e: unknown) {
      let msg = "Failed to accept invite. Please try again.";
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
    "w-full border border-white/[0.08] rounded-lg pl-9 pr-4 py-[11px] text-[13px] bg-white/[0.03] " +
    "text-white placeholder:text-white/20 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus:ring-[#a3e635]/40 focus:border-[#a3e635]/40 " +
    "disabled:opacity-40 transition-all duration-200 hover:border-white/[0.12]";

  // Avoid rendering token-dependent UI until after hydration so the server
  // and client HTML match.
  if (!isClient) {
    return <AcceptInviteSkeleton />;
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[340px] mx-4 bg-[#0a1114]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl px-8 py-9 text-center"
      >
        <CheckCircle className="w-12 h-12 text-energy mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Account Activated</h1>
        <p className="text-[13px] text-white/50 mb-6">
          Your invite has been accepted. Redirecting to your dashboard...
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-[#a3e635] hover:bg-[#bef264] text-[#0a1114] font-bold text-[14px] py-[11px] rounded-lg transition-colors"
        >
          Go to Dashboard
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative z-10 w-full max-w-[340px] mx-4 bg-[#0a1114]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl px-8 py-9"
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
          Accept Invite
        </h1>
        <p className="text-[12.5px] text-white/40 mt-1">
          Set up your staff account
        </p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] text-center overflow-hidden"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-3"
        noValidate
      >
        <motion.div variants={itemVariants}>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/20" />
            <input
              type="text"
              placeholder="Full name"
              autoComplete="name"
              {...form.register("name")}
              className={inputCls}
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>
          <AnimatePresence>
            {form.formState.errors.name && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 text-[11px] text-red-400"
              >
                {form.formState.errors.name.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/20" />
            <input
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              {...form.register("password")}
              className={inputCls}
              style={{ fontFamily: "var(--font-mono)" }}
            />
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
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/20" />
            <input
              type="password"
              placeholder="Confirm password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
              className={inputCls}
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>
          <AnimatePresence>
            {form.formState.errors.confirmPassword && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 text-[11px] text-red-400"
              >
                {form.formState.errors.confirmPassword.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            type="submit"
            disabled={isLoading || !token || !isClient}
            className="w-full bg-[#a3e635] hover:bg-[#bef264] active:bg-[#8bc52f] text-[#0a1114] font-bold text-[14px] py-[11px] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>ACCEPT INVITE</span>
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}

/* ── Fallback while Suspense resolves ── */
function AcceptInviteSkeleton() {
  return (
    <div className="relative z-10 w-full max-w-[340px] mx-4 bg-[#0a1114]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl px-8 py-9">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
        <div className="w-full space-y-3 mt-4">
          <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-11 bg-white/5 rounded-lg animate-pulse mt-2" />
        </div>
      </div>
    </div>
  );
}

/* ── Page wrapper with Suspense boundary ── */
export default function AcceptInvitePage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#060d10]">
      {/* Background image overlay */}
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

      <Suspense fallback={<AcceptInviteSkeleton />}>
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}
