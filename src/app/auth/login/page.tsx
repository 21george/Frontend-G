'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useSubscriptionStore } from '@/store/subscription';
import { SubscriptionAlertModal } from '@/components/subscription/SubscriptionAlertModal';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});
type LoginValues = z.infer<typeof loginSchema>;

/* ── Circuit corner decoration ─────────────────────────────────────────── */
function CircuitCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const right  = pos.endsWith('r');
  const bottom = pos.startsWith('b');

  // Terminal block position (inner edge closer to card)
  const bx = right ? 104 : 12;
  const by = bottom ? 82 : 14;
  // Connector dot center
  const cx = right ? 90 : 110;
  const cy = bottom ? 104 : 36;
  // Trace end (vertical segment end)
  const tyEnd = bottom ? 70 : 70;

  return (
    <div
      className={`absolute pointer-events-none select-none hidden dark:block ${bottom ? 'bottom-0' : 'top-0'} ${right ? 'right-0' : 'left-0'}`}
      aria-hidden
    >
      <svg width="200" height="140" viewBox="0 0 200 140" fill="none">
        {/* Terminal block */}
        <rect x={bx} y={by} width="84" height="44" rx="3" fill="#171717" stroke="#252525" strokeWidth="1" />
        {/* Dot grid (5 × 3) */}
        {[0, 1, 2, 3, 4].flatMap(col =>
          [0, 1, 2].map(row => (
            <circle
              key={`${pos}-${col}-${row}`}
              cx={bx + 14 + col * 14}
              cy={by + 14 + row * 10}
              r="1.5"
              fill="#2e2e2e"
            />
          ))
        )}
        {/* Connector dot */}
        <circle cx={cx} cy={cy} r="4.5" fill="#4a4a4a" stroke="#606060" strokeWidth="1" />
        <circle cx={cx} cy={cy} r="2" fill="#d0d0d0" />
        {/* Horizontal trace from block edge to connector */}
        <line
          x1={right ? bx : bx + 84}
          y1={cy}
          x2={cx}
          y2={cy}
          stroke="#222"
          strokeWidth="1"
        />
        {/* Vertical trace going toward card center */}
        <line
          x1={cx}
          y1={bottom ? cy - 1 : cy + 1}
          x2={cx}
          y2={tyEnd}
          stroke="#222"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const router          = useRouter();
  const setCoach        = useAuthStore((s) => s.setCoach);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setSetupToken   = useSubscriptionStore((s) => s.setSetupToken);

  const [error,        setError]        = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [pendingAlert, setPendingAlert] = useState<'update_payment' | 'resubscribe' | 'renew_subscription' | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  const handleLogin = async (data: LoginValues) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/coach/login', data);
      const { coach, access_token, setup_token } = res.data?.data || {};
      if (!coach || !access_token) throw new Error('Invalid response from server');
      setCoach(coach, access_token);

      if (coach.subscription_status === 'pending' && setup_token) {
        setSetupToken(setup_token, coach.id);
        router.push(`/subscription/select-plan?token=${encodeURIComponent(setup_token)}&coach_id=${coach.id}`);
        return;
      }
      if (coach.subscription_alert === 'select_plan') {
        if (setup_token) {
          setSetupToken(setup_token, coach.id);
          router.push(`/subscription/select-plan?token=${encodeURIComponent(setup_token)}&coach_id=${coach.id}`);
        } else {
          router.push('/subscription/select-plan');
        }
        return;
      }
      if (coach.subscription_alert) {
        setPendingAlert(coach.subscription_alert);
        return;
      }
      router.push('/dashboard');
    } catch (e: unknown) {
      let msg = 'Login failed. Please try again.';
      if (e && typeof e === 'object') {
        const err = e as Record<string, unknown>;
        if (err.code === 'ECONNABORTED' || (typeof err.message === 'string' && err.message.includes('timeout'))) {
          msg = 'Login request timed out. Please check your network connection.';
        } else if (err.message === 'Network Error') {
          msg = 'Cannot connect to the server. Please check your network connection.';
        } else {
          const resp = err.response as Record<string, unknown> | undefined;
          const respData = resp?.data as Record<string, unknown> | undefined;
          if (typeof respData?.message === 'string') msg = respData.message;
        }
      }
      setError(msg);
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Login error:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {pendingAlert && (
        <SubscriptionAlertModal
          alert={pendingAlert}
          onClose={() => { setPendingAlert(null); router.push('/dashboard'); }}
        />
      )}

      <div className="relative min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0e0e0e] overflow-hidden">

        {/* ── Circuit corner decorations ── */}
        <CircuitCorner pos="tl" />
        <CircuitCorner pos="tr" />
        <CircuitCorner pos="bl" />
        <CircuitCorner pos="br" />

        {/* Subtle radial glow behind card */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(30,30,30,0.6) 0%, transparent 70%)' }}
          aria-hidden
        />

        {/* ── Login card ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-[340px] mx-4 bg-white dark:bg-[#181818] border border-[#E2E8F0] dark:border-[#252525] rounded-2xl px-8 py-9 shadow-xl dark:shadow-2xl"
        >

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="flex gap-[3px]" aria-hidden>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#CBD5E1] dark:bg-[#383838]" />
              ))}
            </div>

            <div className="w-11 h-11 rounded-full bg-[#F1F5F9] dark:bg-[#111] border border-[#E2E8F0] dark:border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#3b82f6" strokeWidth="1.8" strokeDasharray="22 12" strokeLinecap="round" />
                <circle cx="11" cy="11" r="3.5" stroke="#3b82f6" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="flex gap-[3px]" aria-hidden>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#CBD5E1] dark:bg-[#383838]" />
              ))}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[22px] font-bold text-[#121212] dark:text-white text-center mt-5 mb-1 tracking-tight">
            Welcome Back
          </h1>

          {/* Subtitle */}
          <p className="text-[12.5px] text-[#64748B] dark:text-[#666] text-center mb-7">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/auth/register"
              className="text-[#132E35] dark:text-white font-semibold hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              Sign up
            </Link>
          </p>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-3" noValidate>

            {/* Email */}
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#94A3B8] dark:text-[#4a4a4a]" />
                <input
                  type="email"
                  placeholder="email address"
                  autoComplete="email"
                  {...form.register('email')}
                  className="w-full bg-white dark:bg-[#111] border border-[#E2E8F0] dark:border-[#252525] rounded-lg pl-9 pr-4 py-[11px] text-[13px] text-[#121212] dark:text-white placeholder:text-[#9CA3AF] dark:placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#132E35] dark:focus:border-[#3d3d3d] transition-colors"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-red-400 text-[11px] mt-1 pl-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#94A3B8] dark:text-[#4a4a4a]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete="current-password"
                  {...form.register('password')}
                  className="w-full bg-white dark:bg-[#111] border border-[#E2E8F0] dark:border-[#252525] rounded-lg pl-9 pr-10 py-[11px] text-[13px] text-[#121212] dark:text-white placeholder:text-[#9CA3AF] dark:placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#132E35] dark:focus:border-[#3d3d3d] transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#4a4a4a] hover:text-[#64748B] dark:hover:text-[#888] transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-red-400 text-[11px] mt-1 pl-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-[14px] py-[11px] rounded-lg transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Login
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
}
