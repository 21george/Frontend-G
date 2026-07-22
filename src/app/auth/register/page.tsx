"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import RegistrationNav from "@/components/layout/RegistrationNav";
import { useAuthStore } from "@/store/auth";
import { useSignupStore } from "@/store/signup";
import { StepIndicator } from "@/components/auth/signup/StepIndicator";
import { ProfileStep } from "@/components/auth/signup/ProfileStep";
import { PlanStep } from "@/components/auth/signup/PlanStep";
import { PaymentStep } from "@/components/auth/signup/PaymentStep";

const STEP_TITLES: Record<number, { heading: string; sub: string }> = {
  1: { heading: "INITIALIZE", sub: "Configure your coach profile" },
  2: { heading: "SELECT TIER", sub: "Choose your billing cycle" },
  3: { heading: "CONFIRM", sub: "Review and complete activation" },
};

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function RegisterPage() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { step } = useSignupStore();
  const prevStep = useRef<number>(step);
  const direction = step > prevStep.current ? 1 : -1;

  useEffect(() => {
    clearAuth();
  }, [clearAuth]);

  useEffect(() => {
    prevStep.current = step;
  }, [step]);

  const { heading, sub } = STEP_TITLES[step] ?? STEP_TITLES[1];

  return (
    <>
      <RegistrationNav />
      <div
        className="relative min-h-[100dvh] flex items-start justify-center overflow-x-hidden pt-24 pb-10"
        style={{
          backgroundImage: "url('/img/360fit-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Heavy dark overlay for instrument feel */}
        <div className="absolute inset-0 bg-[#060d10]/85" aria-hidden />

        {/* Animated grain texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
          }}
          aria-hidden
        />

        {/* Subtle radial glow behind card */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, #a3e635 0%, transparent 70%)" }}
          aria-hidden
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-lg mx-4 bg-[#0a1114]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Top sheen */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a3e635]/30 to-transparent"
          />

          {/* Header */}
          <div className="px-8 pt-8 pb-5 border-b border-white/[0.06]">
            {/* Logo + Step indicator */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden ring-1 ring-white/10">
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
              </div>
              <span
                className="text-[11px] text-[#a3e635]/80 tracking-widest uppercase font-medium"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Step {step}/3
              </span>
            </div>

            <StepIndicator currentStep={step as 1 | 2 | 3} />

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <h1
                  className="text-xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {heading}
                </h1>
                <p className="text-sm text-white/40 mt-1 tracking-wide">
                  {sub}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step content */}
          <div className="px-8 py-7">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {step === 1 && <ProfileStep />}
                {step === 2 && <PlanStep />}
                {step === 3 && <PaymentStep />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 pb-7 text-center border-t border-white/[0.06] pt-5">
            <p className="text-xs text-white/30">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-[#a3e635] hover:text-[#bef264] transition-colors font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
