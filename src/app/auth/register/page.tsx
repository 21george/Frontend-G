'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import apiClient from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const sanitizeText = (value: string) =>
  value
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const schema = z
  .object({
    firstName: z.string().transform(sanitizeText).pipe(z.string().min(2, 'First name is required')),
    lastName: z.string().transform(sanitizeText).pipe(z.string().min(2, 'Last name is required')),
    email: z.string().transform((v) => sanitizeText(v).toLowerCase()).pipe(z.string().email('Enter a valid email')),
    password: z.string().trim().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().trim(),
    verificationCode: z.string().transform(sanitizeText).pipe(z.string().min(4, 'Enter the email verification code')),
    emailVerified: z.boolean().refine((v) => v, { message: 'You must verify your email before continuing' }),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      })
    }
  })

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      verificationCode: '',
      emailVerified: false,
    },
  })

  const onSubmit = async (data: FormValues) => {
    setError(null)
    setIsLoading(true)
    try {
      await apiClient.post('/auth/coach/register', {
        name: data.firstName,
        surname: data.lastName,
        email: data.email,
        password: data.password,
        verification_code: data.verificationCode,
        email_verified: data.emailVerified,
      })
      router.push('/auth/login')
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col md:flex-row">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm max-w-[90vw] text-center">
          {error}
        </div>
      )}
      <div className="flex w-full flex-col items-center justify-center bg-background px-5 py-10 sm:p-8 md:w-1/2 min-h-[100dvh] md:min-h-0">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <div className="mb-2">
              <h1 className="text-xl font-semibold text-blue-600 tracking-wider">CoachPro</h1>
              <p className="text-sm text-muted-foreground mt-2">Create your account to get started</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="verificationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email verification code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter code from your email" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailVerified"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-3">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                        </FormControl>
                        <div>
                          <FormLabel className="font-normal">I verified my email before continuing</FormLabel>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-foreground underline hover:opacity-80">
                    Sign in
                  </Link>
                </p>
              </form>
            </Form>
          </div>
        </div>
      </div>

      <div className="relative hidden md:block md:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1714715350295-5f00e902f0d7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8d2FsbHBhZXJ8ZW58MHwxfDB8fHww&auto=format&fit=crop&q=60&w=900"
          alt="A beautiful landscape with rolling hills and a road."
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    </div>
  )
}
