'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { AuthFormSplitScreen } from '@/components/ui/login';

export default function LoginPage() {
  const router = useRouter();
  const setCoach = useAuthStore((s) => s.setCoach);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  // Handler for AuthFormSplitScreen
  const handleLogin = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    setError(null);
    try {
      const res = await apiClient.post('/auth/coach/login', data);
      const { coach } = res.data.data;
      setCoach(coach);
      router.push('/dashboard');
    } catch (e: any) {
      let msg = 'Login failed. Please try again.';
      if (e?.code === 'ECONNABORTED' || e?.message?.includes('timeout')) {
        msg = 'Login request timed out. Please check your network connection or try again later.';
      } else if (e?.message === 'Network Error') {
        msg = 'Cannot connect to the server. Please check your network connection.';
      } else if (e?.response?.data?.message) {
        msg = e.response.data.message;
      }
      setError(msg);
      // Log error for debugging, but do not leak sensitive info to user
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Login error:', e);
      }
    }
  };

  return (
    <>
      <AuthFormSplitScreen
        logo={
          <h1 className="text-xl font-semibold text-blue-600 tracking-wider">CoachPro</h1>
        }
        title="Welcome back"
        description="Sign in to your coaching dashboard"
        imageSrc="https://images.unsplash.com/photo-1714715350295-5f00e902f0d7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8d2FsbHBhZXJ8ZW58MHwxfDB8fHww&auto=format&fit=crop&q=60&w=900"
        imageAlt="A beautiful landscape with rolling hills and a road."
        onSubmit={handleLogin}
        forgotPasswordHref="#"
        createAccountHref="/auth/register"
        error={error}
      />
    </>
  );
}
