'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySubscription = async () => {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setError('Invalid session');
        setIsVerifying(false);
        return;
      }

      try {
        // Verify the subscription status
        const res = await apiClient.get('/subscription');
        const { status, tier } = res.data.data;

        if (status === 'active' || status === 'trialing') {
          // Subscription verified, redirect to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        } else {
          setError('Subscription not yet activated. Please contact support.');
          setIsVerifying(false);
        }
      } catch (e: any) {
        // If not authenticated, they may need to log in
        if (e?.response?.status === 401) {
          // User might not have cookies set yet - this is expected after Stripe redirect
          // We'll show a message and redirect
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        } else {
          setError('Failed to verify subscription');
          setIsVerifying(false);
        }
      }
    };

    verifySubscription();
  }, [searchParams]);

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto px-4"
      >
        {isVerifying ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto mb-6" />
            </motion.div>

            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Payment Successful!
            </h1>

            <p className="text-lg text-slate-600 mb-8">
              Thank you for subscribing. Verifying your subscription...
            </p>

            <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto" />

            <p className="text-sm text-slate-500 mt-4">
              Redirecting to dashboard...
            </p>
          </>
        ) : error ? (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Verification Issue
            </h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}
