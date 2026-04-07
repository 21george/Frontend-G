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
      const { access_token, refresh_token, coach } = res.data.data;
      setCoach(coach, access_token, refresh_token);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Login failed');
      throw e;
    }
  };

  return (
    <div className="relative h-screen flex items-center justify-center sm:justify-center overflow-hidden">
      <div className="relative z-10 w-full  jsut">
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
          createAccountHref="#"
        />
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded shadow-lg z-20">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
