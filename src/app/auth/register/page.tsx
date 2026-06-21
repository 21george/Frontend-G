'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import RegistrationNav from '@/components/layout/RegistrationNav'
import { useAuthStore } from '@/store/auth'
import { useSignupStore } from '@/store/signup'
import { StepIndicator } from '@/components/auth/signup/StepIndicator'
import { ProfileStep } from '@/components/auth/signup/ProfileStep'
import { PlanStep } from '@/components/auth/signup/PlanStep'
import { PaymentStep } from '@/components/auth/signup/PaymentStep'

/* ── Circuit corner decoration ─────────────────────────────────────────── */
function CircuitCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const right = pos.endsWith('r')
  const bottom = pos.startsWith('b')
  const bx = right ? 104 : 12
  const by = bottom ? 82 : 14
  const cx = right ? 90 : 110
  const cy = bottom ? 104 : 36
  const tyEnd = 70

  return (
    <div
      className={`absolute pointer-events-none select-none ${bottom ? 'bottom-0' : 'top-0'} ${right ? 'right-0' : 'left-0'}`}
      aria-hidden
    >
      <svg width="200" height="140" viewBox="0 0 200 140" fill="none" style={{ opacity: 0.45 }}>
        <rect x={bx} y={by} width="84" height="44" rx="3" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="1" />
        {[0, 1, 2, 3, 4].flatMap((col) =>
          [0, 1, 2].map((row) => (
            <circle key={`${pos}-${col}-${row}`} cx={bx + 14 + col * 14} cy={by + 14 + row * 10} r="1.5" fill="var(--border-hover)" />
          ))
        )}
        <circle cx={cx} cy={cy} r="4.5" fill="var(--border-hover)" stroke="var(--text-tertiary)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r="2" fill="var(--text-secondary)" />
        <line x1={right ? bx : bx + 84} y1={cy} x2={cx} y2={cy} stroke="var(--border)" strokeWidth="1" />
        <line x1={cx} y1={bottom ? cy - 1 : cy + 1} x2={cx} y2={tyEnd} stroke="var(--border)" strokeWidth="1" />
      </svg>
    </div>
  )
}

const STEP_TITLES: Record<number, { heading: string; sub: string }> = {
  1: { heading: 'Create your account', sub: 'Fill in your details to get started' },
  2: { heading: 'Choose your plan', sub: 'Select the billing period that works for you' },
  3: { heading: 'Complete payment', sub: 'Review your order and proceed to checkout' },
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
}

export default function RegisterPage() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { step } = useSignupStore()
  const prevStep = React.useRef<number>(step)
  const direction = step > prevStep.current ? 1 : -1

  React.useEffect(() => {
    clearAuth()
  }, [clearAuth])

  React.useEffect(() => {
    prevStep.current = step
  }, [step])

  const { heading, sub } = STEP_TITLES[step] ?? STEP_TITLES[1]

  return (
    <>
      <RegistrationNav />
      <div className="relative min-h-[100dvh] flex items-start justify-center bg-[#F8FAFC] dark:bg-[#050505] overflow-x-hidden pt-20">
      <CircuitCorner pos="tl" />
      <CircuitCorner pos="tr" />
      <CircuitCorner pos="bl" />
      <CircuitCorner pos="br" />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(19,46,53,0.07) 0%, transparent 70%)' }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-lg mx-4 my-10 bg-white dark:bg-[#181818] border border-[#E2E8F0] dark:border-[#252525] rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-[#F1F5F9] dark:bg-[#111] border border-[#E2E8F0] dark:border-[#2a2a2a] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#3b82f6" strokeWidth="1.8" strokeDasharray="22 12" strokeLinecap="round" />
                <circle cx="11" cy="11" r="3.5" stroke="#3b82f6" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-sm font-bold text-[var(--text-primary)] tracking-wide">CoachPro</span>
          </div>

          <StepIndicator currentStep={step as 1 | 2 | 3} />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">{heading}</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">{sub}</p>
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
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {step === 1 && <ProfileStep />}
              {step === 2 && <PlanStep />}
              {step === 3 && <PaymentStep />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 pb-7 text-center">
          <p className="text-xs text-[var(--text-tertiary)]">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-teal-600 hover:underline underline-offset-2 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
