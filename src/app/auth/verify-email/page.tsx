'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Mail, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coachId = searchParams.get('id');
  const setCoach = useAuthStore((s) => s.setCoach);

  const [digits, setDigits] = React.useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = React.useState<string | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [success, setSuccess] = React.useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no coach_id
  useEffect(() => {
    if (!coachId) router.replace('/auth/register');
  }, [coachId, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      // Only allow single digit
      const digit = value.replace(/\D/g, '').slice(-1);
      setDigits((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });
      setError(null);

      // Auto-advance focus
      if (digit && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const newDigits = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }, []);

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length !== CODE_LENGTH) {
      setError('Please enter all 6 digits');
      return;
    }

    setError(null);
    setIsVerifying(true);
    try {
      const res = await apiClient.post('/auth/verify-email', {
        coach_id: coachId,
        code,
      });
      const { coach } = res.data.data;
      setSuccess(true);
      setCoach(coach);
      // Brief success moment before redirect
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Verification failed. Please try again.';
      setError(msg);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      await apiClient.post('/auth/resend-verification', { coach_id: coachId });
      setResendCooldown(RESEND_COOLDOWN);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to resend code.';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  // Auto-submit when all digits are entered
  useEffect(() => {
    if (digits.every((d) => d !== '') && !isVerifying) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  if (!coachId) return null;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md text-center"
      >
        {/* Icon */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <div className={`w-16 h-16 flex items-center justify-center transition-colors duration-500 ${success ? 'bg-emerald-100' : 'bg-blue-50'}`}>
            {success ? (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </motion.svg>
            ) : (
              <Mail className="w-8 h-8 text-blue-600" />
            )}
          </div>
        </motion.div>

        {/* Title */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-semibold tracking-tight">
            {success ? 'Email Verified!' : 'Check your email'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {success
              ? 'Redirecting to your dashboard...'
              : 'We sent a 6-digit verification code to your email'}
          </p>
        </motion.div>

        {/* Code inputs */}
        {!success && (
          <>
            <motion.div variants={itemVariants} className="flex justify-center gap-3 mt-8">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={isVerifying}
                  className="w-12 h-14 text-center text-xl font-semibold border-2 border-slate-200 bg-white
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none
                    disabled:opacity-50 transition-all duration-200
                    dark:bg-surface-page-dark dark:border-white/10 dark:text-white dark:focus:border-blue-400"
                />
              ))}
            </motion.div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 mt-4"
              >
                {error}
              </motion.p>
            )}

            {/* Verify button */}
            <motion.div variants={itemVariants} className="mt-6">
              <Button
                className="w-full"
                disabled={isVerifying || digits.some((d) => !d)}
                onClick={handleVerify}
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Email
              </Button>
            </motion.div>

            {/* Resend */}
            <motion.div variants={itemVariants} className="mt-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isResending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Didn't receive the code? Resend"}
              </button>
            </motion.div>

            {/* Back link */}
            <motion.div variants={itemVariants} className="mt-6">
              <Link href="/auth/register" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                ← Back to registration
              </Link>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
