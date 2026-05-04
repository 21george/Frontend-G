'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCreateClient } from '@/lib/hooks'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Copy, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  name:        z.string().min(2, 'Name required'),
  email:       z.string().email().optional().or(z.literal('')),
  phone:       z.string().optional(),
  address:     z.string().optional(),
  city:        z.string().optional(),
  postal_code: z.string().optional(),
  nationality: z.string().optional(),
  occupation:  z.string().optional(),
  language:    z.enum(['en', 'de']),
  notes:       z.string().optional(),
})
type Form = z.infer<typeof schema>

export default function NewClientPage() {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const createClient = useCreateClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { language: 'en' },
  })

  const onSubmit = async (data: Form) => {
    const res = await createClient.mutateAsync(data)
    setGeneratedCode(res.data.login_code)
    setEmailSent(!!res.data.email_sent)
  }

  const copy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (generatedCode) {
    return (
      <DashboardLayout>
        <div >
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Created!</h2>
            <p className="text-gray-500 text-sm mb-6">
              {emailSent
                ? 'Login code has been emailed to the client automatically.'
                : 'Share this login code with your client. They use it to log into the app.'}
            </p>
            {emailSent && (
              <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 text-[13px] font-medium">
                <Check className="w-4 h-4" /> Email sent with login code
              </div>
            )}
            <div className="bg-brand-light border-2 border-brand p-6 mb-4">
              <p className="text-sm text-brand font-medium mb-1">Client Login Code</p>
              <p className="text-3xl font-semibold tracking-widest text-brand-dark font-mono">{generatedCode}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={copy} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
              </button>
              <Link href="/clients" className="btn-secondary flex-1 text-center">Done</Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div >
        <Link href="/clients" className="flex items-center gap-1 text-sm text-gray-100 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-3 h-3 text-gray-50" /> Back
        </Link>
        <h1 className="text-2xl font-semibold text-gray-200 mb-6">Add New Client</h1>
        <div className="card p-6 ">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Full Name *</label>
              <input {...register('name')} className="input" placeholder="Full Name" />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Email</label>
                <input {...register('email')} type="email" className="input" placeholder="Email" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input {...register('phone')} className="input" placeholder="Phone Number" />
              </div>
            </div>
            <div>
              <label className="label">Address</label>
              <input {...register('address')} className="input" placeholder="Street address" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">City</label>
                <input {...register('city')} className="input" placeholder="City" />
              </div>
              <div>
                <label className="label">Postal Code</label>
                <input {...register('postal_code')} className="input" placeholder="Postal code" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nationality</label>
                <input {...register('nationality')} className="input" placeholder="Nationality" />
              </div>
              <div>
                <label className="label">Occupation</label>
                <input {...register('occupation')} className="input" placeholder="Occupation" />
              </div>
            </div>
            <div>
              <label className="label">Language</label>
              <select {...register('language')} className="input">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea {...register('notes')} className="input h-24 resize-none" placeholder="Goals, injuries, preferences…" />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
              {isSubmitting ? 'Creating…' : 'Create Client & Generate Code'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
