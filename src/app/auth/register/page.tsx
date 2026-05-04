'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
    email: z.string().trim().email('Please enter a valid email').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterValues = z.infer<typeof registerSchema>;

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: '', color: 'bg-slate-200', width: 'w-0' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
  if (score <= 3) return { label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' };
  return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function RegisterPage() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  // Clear any stale auth state on mount
  React.useEffect(() => {
    clearAuth();
  }, [clearAuth]);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const passwordValue = form.watch('password');
  const strength = getPasswordStrength(passwordValue);

  const handleRegister = async (data: RegisterValues) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/coach/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      const { id, setup_token } = res.data.data;
      // Redirect to plan selection with setup token
      router.push(`/subscription/select-plan?coach_id=${id}&token=${setup_token}`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col md:flex-row">
      {/* Error toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 z-50 text-sm max-w-[90vw] text-center">
          {error}
        </div>
      )}

      {/* Left Panel: Form */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-5 py-10 sm:p-8 md:w-1/2 min-h-[100dvh] md:min-h-0">
        <div className="w-full max-w-md">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-5"
          >
            <motion.div variants={itemVariants}>
              <h1 className="text-xl font-semibold text-blue-600 tracking-wider">CoachPro</h1>
            </motion.div>

            <motion.div variants={itemVariants} className="text-left">
              <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Start your 14-day free Pro trial — no credit card required
              </p>
            </motion.div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            style={{ borderRadius: '8px' }}
                            placeholder="John Doe"
                            maxLength={255}
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            style={{ borderRadius: '8px' }}
                            placeholder="email@example.com"
                            maxLength={255}
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              style={{ borderRadius: '8px' }}
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              maxLength={128}
                              {...field}
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </FormControl>
                        {/* Password strength bar */}
                        {passwordValue && (
                          <div className="mt-2">
                            <div className="h-1.5 w-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`}
                              />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{strength.label}</p>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              style={{ borderRadius: '8px' }}
                              type={showConfirm ? 'text' : 'password'}
                              placeholder="••••••••"
                              maxLength={128}
                              {...field}
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowConfirm((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </motion.div>

                <motion.div variants={itemVariants} className="text-center">
                  <p className="text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
                      Sign in
                    </Link>
                  </p>
                </motion.div>
              </form>
            </Form>
          </motion.div>
        </div>
      </div>

      {/* Right Panel: Image */}
      <div className="relative hidden md:block md:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=900"
          alt="Fitness coaching in a modern gym"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-12 left-8 right-8">
          <div className="bg-white/10 backdrop-blur-lg p-6 text-white border border-white/20">
            <p className="text-lg font-semibold">&ldquo;CoachPro saved me 10+ hours a week managing clients.&rdquo;</p>
            <p className="text-sm mt-2 text-white/80">— Sarah M., Certified Personal Trainer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
