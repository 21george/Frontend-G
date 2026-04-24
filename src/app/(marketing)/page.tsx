'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Users,
  Dumbbell,
  BarChart3,
  MessageSquare,
  UtensilsCrossed,
  CalendarCheck,
  ChevronRight,
  Check,
  ArrowRight,
  Zap,
  Star,
  Menu,
  X,
} from 'lucide-react';

/* ─── Animated Counter ──────────────────────────────────────────────────────── */
function AnimatedCount({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── Section wrapper with scroll animation ─────────────────────────────────── */
function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── Feature data ───────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Users,
    title: 'Client Management',
    desc: 'Organize all your clients in one place with detailed profiles, progress tracking, and communication history.',
  },
  {
    icon: Dumbbell,
    title: 'Workout Builder',
    desc: 'Create customized workout plans with exercise libraries, sets, reps, and tempo prescriptions.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Nutrition Plans',
    desc: 'Build meal plans with macros, day-by-day meal breakdowns, and dietary preference support.',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    desc: 'Track body measurements, workout completion rates, and client engagement with visual dashboards.',
  },
  {
    icon: MessageSquare,
    title: 'In-App Messaging',
    desc: 'Chat with clients directly, share files, and keep all communication in one secure place.',
  },
  {
    icon: CalendarCheck,
    title: 'Check-in Scheduling',
    desc: 'Schedule regular check-ins, send automated reminders, and manage your coaching calendar.',
  },
];

/* ─── Pricing data ───────────────────────────────────────────────────────────── */
const plans = [
  {
    name: 'Free',
    price: 0,
    annual: 0,
    desc: 'For coaches just getting started',
    clients: '3 clients',
    features: ['Client management', 'Workout plans', 'Basic messaging', 'Progress photos'],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 29,
    annual: 24,
    desc: 'For growing coaching businesses',
    clients: '25 clients',
    features: [
      'Everything in Free',
      'Nutrition plans',
      'Analytics dashboard',
      'Group workouts',
      'Check-in scheduling',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Business',
    price: 79,
    annual: 66,
    desc: 'For established coaching teams',
    clients: 'Unlimited clients',
    features: [
      'Everything in Pro',
      'Live training sessions',
      'Client import/export',
      'Custom branding',
      'API access',
      'Dedicated support',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
];

/* ─── Testimonials ───────────────────────────────────────────────────────────── */
const testimonials = [
  {
    quote: 'CoachPro transformed how I manage my clients. I went from spreadsheets chaos to organized bliss in one day.',
    name: 'Sarah Mitchell',
    role: 'Certified Personal Trainer',
    avatar: 'SM',
  },
  {
    quote: 'The workout builder alone is worth it. My clients love getting their plans directly in the app with video demos.',
    name: 'James Rodriguez',
    role: 'Strength & Conditioning Coach',
    avatar: 'JR',
  },
  {
    quote: 'I tripled my client base in 3 months because I could finally scale without burning out on admin work.',
    name: 'Emily Chen',
    role: 'Online Fitness Coach',
    avatar: 'EC',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sticky navbar effect
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-[#141414]/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50 dark:border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-blue-600 tracking-wider">
            CoachPro
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
              Testimonials
            </a>
            <Link href="/auth/login" className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-950 text-white text-sm font-medium hover:bg-cyan-900 transition-colors shadow-sm"
            >
              Get Started <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2">
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white dark:bg-[#171717] border-t border-slate-200 dark:border-white/5 px-4 py-4 space-y-3"
          >
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-600 dark:text-slate-300">
              Features
            </a>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-600 dark:text-slate-300">
              Pricing
            </a>
            <a href="#testimonials" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-600 dark:text-slate-300">
              Testimonials
            </a>
            <Link href="/auth/login" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="block text-center px-4 py-2 rounded-lg bg-cyan-950 text-white text-sm font-medium"
            >
              Get Started
            </Link>
          </motion.div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div ref={heroRef} className="relative overflow-hidden pt-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-[#141414] dark:via-[#1a1a1a] dark:to-[#141414]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                <Zap size={14} /> 14-day Pro trial &middot; No credit card required
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
            >
              The All-in-One{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Coaching Platform
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
            >
              Manage clients, build workout plans, track nutrition, and grow your coaching business — all from one
              beautiful dashboard.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-cyan-950 text-white font-semibold text-base hover:bg-cyan-900 active:bg-cyan-800 transition-all shadow-lg shadow-cyan-950/20 hover:shadow-xl"
              >
                Start Free Trial <ArrowRight size={18} />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white dark:bg-white/5 text-slate-700 dark:text-white font-semibold text-base border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm"
              >
                Sign In <ChevronRight size={18} />
              </Link>
            </motion.div>
          </div>

          {/* Dashboard mockup with parallax */}
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="mt-16 lg:mt-20 max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-200/50 dark:border-white/5">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-1 rounded-2xl">
                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-xl aspect-[16/9] flex items-center justify-center">
                  <div className="text-center px-8">
                    <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
                      <div className="bg-white dark:bg-white/5 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-white/5">
                        <p className="text-2xl font-bold text-blue-600">24</p>
                        <p className="text-xs text-slate-500 mt-1">Active Clients</p>
                      </div>
                      <div className="bg-white dark:bg-white/5 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-white/5">
                        <p className="text-2xl font-bold text-emerald-600">92%</p>
                        <p className="text-xs text-slate-500 mt-1">Completion</p>
                      </div>
                      <div className="bg-white dark:bg-white/5 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-white/5">
                        <p className="text-2xl font-bold text-amber-600">4.9</p>
                        <p className="text-xs text-slate-500 mt-1">Rating</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">Your coaching dashboard — everything in one place</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Social Proof ───────────────────────────────────────────────────── */}
      <Section className="py-16 border-y border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                <AnimatedCount target={500} suffix="+" />
              </p>
              <p className="text-sm text-slate-500 mt-1">Active Coaches</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                <AnimatedCount target={10000} suffix="+" />
              </p>
              <p className="text-sm text-slate-500 mt-1">Clients Managed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                <AnimatedCount target={50000} suffix="+" />
              </p>
              <p className="text-sm text-slate-500 mt-1">Workouts Created</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-1">
                4.9 <Star size={20} className="text-amber-500 fill-amber-500" />
              </p>
              <p className="text-sm text-slate-500 mt-1">Coach Rating</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <Section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Features</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to coach smarter
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              From client management to analytics, CoachPro gives you the tools to deliver exceptional coaching
              experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 shadow-sm hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                  <f.icon size={22} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <Section className="py-24 lg:py-32 bg-slate-50 dark:bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">How It Works</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              Up and running in 3 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Your Account',
                desc: 'Sign up in 30 seconds. Your 14-day Pro trial starts immediately — no credit card needed.',
              },
              {
                step: '02',
                title: 'Add Your Clients',
                desc: 'Import existing clients or add them one by one. Each gets a unique login code to access the app.',
              },
              {
                step: '03',
                title: 'Start Coaching',
                desc: 'Build workout plans, nutrition guides, and track progress — all from your unified dashboard.',
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-950 text-white flex items-center justify-center text-xl font-bold mx-auto">
                  {s.step}
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-slate-200 dark:bg-white/10" />
                )}
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <Section id="pricing" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Pricing</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Start free, upgrade when you&apos;re ready. No hidden fees.
            </p>

            {/* Monthly / Annual toggle */}
            <div className="mt-8 inline-flex items-center gap-3 bg-slate-100 dark:bg-white/5 rounded-full p-1">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !isAnnual
                    ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white'
                    : 'text-slate-500'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isAnnual
                    ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white'
                    : 'text-slate-500'
                }`}
              >
                Annual <span className="text-emerald-600 text-xs font-semibold ml-1">-17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-cyan-950 text-white ring-2 ring-cyan-600 shadow-xl scale-[1.02]'
                    : 'bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 shadow-sm'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-500 text-white text-xs font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className={`text-sm mt-1 ${plan.highlighted ? 'text-cyan-200' : 'text-slate-500'}`}>
                  {plan.desc}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${isAnnual ? plan.annual : plan.price}</span>
                  {plan.price > 0 && (
                    <span className={`text-sm ${plan.highlighted ? 'text-cyan-200' : 'text-slate-500'}`}>/mo</span>
                  )}
                </div>
                <p className={`text-sm mt-2 font-medium ${plan.highlighted ? 'text-cyan-100' : 'text-slate-700 dark:text-slate-300'}`}>
                  {plan.clients}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <Check
                        size={16}
                        className={`mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-cyan-300' : 'text-emerald-500'}`}
                      />
                      <span className={plan.highlighted ? 'text-cyan-50' : 'text-slate-600 dark:text-slate-400'}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/auth/register?plan=${plan.name.toLowerCase()}`}
                  className={`mt-8 block text-center px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-white text-cyan-950 hover:bg-cyan-50'
                      : 'bg-cyan-950 text-white hover:bg-cyan-900'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <Section id="testimonials" className="py-24 lg:py-32 bg-slate-50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Testimonials</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">Loved by coaches worldwide</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 shadow-sm"
              >
                <div className="flex gap-1 mb-4">
                  {Array(5)
                    .fill(0)
                    .map((_, j) => (
                      <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                    ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <Section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl bg-gradient-to-br from-cyan-950 to-slate-900 p-12 lg:p-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to transform your coaching?
            </h2>
            <p className="mt-4 text-cyan-200 text-lg max-w-xl mx-auto">
              Join hundreds of coaches who are saving time, growing their business, and delivering better results with
              CoachPro.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-cyan-950 font-semibold text-base hover:bg-cyan-50 transition-all shadow-lg"
              >
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-white font-semibold text-base hover:bg-white/10 transition-all"
              >
                View Pricing
              </Link>
            </div>
            <p className="mt-6 text-sm text-cyan-300/70">14-day Pro trial &middot; No credit card required &middot; Cancel anytime</p>
          </div>
        </div>
      </Section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/50 dark:border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <span className="text-xl font-bold text-blue-600 tracking-wider">CoachPro</span>
              <p className="mt-3 text-sm text-slate-500 max-w-xs">
                The all-in-one platform for fitness coaches who want to scale their business.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Product</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="#features" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
                    Testimonials
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Account</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/auth/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
                    Create Account
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Terms of Service</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-200/50 dark:border-white/5 text-center">
            <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} CoachPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
