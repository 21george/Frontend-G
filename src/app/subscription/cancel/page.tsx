'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscriptionCancelPage() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <XCircle className="h-24 w-24 text-slate-400 mx-auto mb-6" />
        </motion.div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Payment Cancelled
        </h1>

        <p className="text-lg text-slate-600 mb-8">
          No worries! Your payment was not processed. You can try again or continue with a different plan.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="secondary"
            onClick={() => router.push('/subscription/select-plan')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Choose Another Plan
          </Button>

          <Button
            onClick={() => router.push('/subscription/select-plan')}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> All paid plans include a 14-day free trial.
            You won&apos;t be charged until the trial ends.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
