'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import apiClient from '@/lib/api';
import { useSubscriptionStore } from '@/store/subscription';
import { Button } from '@/components/ui/button';

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'Up to 3 clients',
      'Basic workout plans',
      'Client messaging',
      'Progress tracking',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing coaches',
    features: [
      'Up to 25 clients',
      'Advanced workout builder',
      'Nutrition plans',
      'Live training sessions',
      'Priority support',
      '14-day free trial',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    id: 'business' as const,
    name: 'Business',
    price: '$79',
    period: '/month',
    description: 'For established businesses',
    features: [
      'Unlimited clients',
      'Everything in Pro',
      'Advanced analytics',
      'White-label options',
      'Dedicated support manager',
      'Custom integrations',
      '14-day free trial',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function SelectPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setupToken, coachId, setSetupToken, setError: setStoreError } = useSubscriptionStore();

  useEffect(() => {
    // Get token from URL params
    const token = searchParams.get('token');
    const coachIdParam = searchParams.get('coach_id');

    if (token && coachIdParam) {
      setSetupToken(token, coachIdParam);
    } else if (!setupToken) {
      // No valid token, redirect to registration
      router.push('/auth/register');
    }
  }, [searchParams, setupToken, setSetupToken, router]);

  const handleSelectPlan = async (planId: 'free' | 'pro' | 'business') => {
    if (!setupToken) {
      setError('Session expired. Please register again.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await apiClient.post(
        '/subscription/select-plan',
        { plan_tier: planId },
        {
          headers: {
            Authorization: `Bearer ${setupToken}`,
          },
        }
      );

      const { checkout_url, access_token, redirect } = res.data.data;

      if (planId === 'free') {
        // Free plan - set auth cookies and redirect to dashboard
        if (access_token) {
          // Tokens are set via cookies from backend
          window.location.href = redirect || '/dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        // Paid plan - redirect to Stripe Checkout
        if (checkout_url) {
          window.location.href = checkout_url;
        } else {
          setError('Failed to create checkout session');
        }
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to select plan. Please try again.';
      setError(msg);
      setStoreError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!setupToken) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white">
      {/* Error toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 z-50 text-sm max-w-[90vw] text-center">
          {error}
        </div>
      )}

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-blue-600 tracking-wider">CoachPro</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Select the perfect plan for your coaching business
          </p>
        </motion.div>

        {/* Plan Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto"
        >
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`relative flex flex-col border-2 bg-white p-8 transition-all ${
                plan.highlighted
                  ? 'border-blue-500 -500/20'
                  : 'border-slate-200'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 ">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-slate-500">{plan.period}</span>
              </div>

              <ul className="mb-8 space-y-3 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isLoading}
                className={`w-full ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <h3 className="text-xl font-semibold text-center mb-8">
            Everything you need to grow your coaching business
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Client Management', desc: 'Track progress, manage schedules' },
              { title: 'Workout Plans', desc: 'Custom builders & templates' },
              { title: 'Nutrition Plans', desc: 'Macro tracking & meal plans' },
              { title: 'Live Training', desc: 'Video sessions with clients' },
              { title: 'Messaging', desc: 'Direct communication channel' },
              { title: 'Analytics', desc: 'Progress insights & reports' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="h-10 w-10 bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-50 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-slate-500">
          <p>14-day free trial on Pro and Business plans. No credit card required for signup.</p>
          <p className="mt-2">Cancel anytime from your account settings.</p>
        </div>
      </footer>
    </div>
  );
}
