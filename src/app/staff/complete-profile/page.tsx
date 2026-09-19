"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { User, Loader2, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { staffApi } from "@/lib/api";

// SSR-safe hydration guard: false during server render, true after hydration.
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters." }),
});
type ProfileValues = z.infer<typeof profileSchema>;

export default function CompleteStaffProfilePage() {
  const router = useRouter();
  const staff = useAuthStore((s) => s.staff);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setStaff = useAuthStore((s) => s.setStaff);
  const isStaff = useAuthStore((s) => s.isStaff);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isHydrated = useHydrated();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: staff?.name || "" },
  });

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !isStaff) {
      router.replace("/staff/login");
      return;
    }
    // If the profile already has a name, there's nothing to finish.
    if (staff?.name && staff.name.trim().length >= 2) {
      router.replace("/dashboard");
    }
  }, [isHydrated, isAuthenticated, isStaff, staff, router]);

  const handleSubmit = async (data: ProfileValues) => {
    setError(null);
    try {
      const res = await staffApi.updateProfile({ name: data.name });
      const updated = res.data;
      if (updated) {
        // Preserve the existing role / status in the store by merging with the
        // currently known staff record. The backend only returns a subset.
        setStaff(
          {
            ...(staff ?? {}),
            ...updated,
            id: updated.id ?? staff?.id ?? "",
            org_id: updated.org_id ?? staff?.org_id ?? "",
            email: updated.email ?? staff?.email ?? "",
            role: updated.role ?? staff?.role ?? "instructor_coach",
            status: updated.status ?? staff?.status ?? "active",
          },
          accessToken ?? undefined,
        );
      }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (e: unknown) {
      let msg = "Failed to save profile. Please try again.";
      if (e && typeof e === "object") {
        const err = e as Record<string, unknown>;
        const resp = err.response as Record<string, unknown> | undefined;
        const respData = resp?.data as Record<string, unknown> | undefined;
        if (typeof respData?.message === "string") msg = respData.message;
      }
      setError(msg);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060d10]">
        <Loader2 className="w-8 h-8 text-energy animate-spin" />
      </div>
    );
  }

  const inputCls =
    "w-full border border-white/[0.08] rounded-lg pl-9 pr-4 py-[11px] text-[13px] bg-white/[0.03] " +
    "text-white placeholder:text-white/20 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus:ring-[#a3e635]/40 focus:border-[#a3e635]/40 " +
    "disabled:opacity-40 transition-all duration-200 hover:border-white/[0.12]";

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#060d10]">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[360px] mx-4 bg-[#0a1114]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl px-8 py-9 shadow-2xl shadow-black/50"
      >
        {success ? (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-[#a3e635] mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">
              Profile Complete
            </h1>
            <p className="text-[13px] text-white/50">
              Redirecting to your dashboard...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
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
                Complete Your Profile
              </h1>
              <p className="text-[12.5px] text-white/40 mt-1">
                Tell us your name to finish setting up your account.
              </p>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] text-center">
                {error}
              </div>
            )}

            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-3"
              noValidate
            >
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
              {form.formState.errors.name && (
                <p className="text-[11px] text-red-400">
                  {form.formState.errors.name.message}
                </p>
              )}

              <motion.button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full bg-[#a3e635] hover:bg-[#bef264] active:bg-[#8bc52f] text-[#0a1114] font-bold text-[14px] py-[11px] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                style={{
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.05em",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span>CONTINUE</span>
              </motion.button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
