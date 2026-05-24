'use client'

import 'intl-tel-input/styles'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCreateClient } from '@/lib/hooks'
import { clientsApi } from '@/lib/api'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { getCountryCallingCode, type CountryCode } from 'libphonenumber-js'
import * as AllFlags from 'country-flag-icons/react/3x2'
import { Copy, Check, ArrowLeft, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { Client } from '@/types'

// ── Country data ──────────────────────────────────────────────────────────────

type Country = { code: string; name: string; dialCode: string }

const COUNTRIES: Country[] = ([
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CA', name: 'Canada' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'KM', name: 'Comoros' },
  { code: 'CG', name: 'Congo' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CU', name: 'Cuba' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'DM', name: 'Dominica' },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'EE', name: 'Estonia' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' },
  { code: 'GD', name: 'Grenada' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japan' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KI', name: 'Kiribati' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' },
  { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Islands' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MX', name: 'Mexico' },
  { code: 'FM', name: 'Micronesia' },
  { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'NA', name: 'Namibia' },
  { code: 'NR', name: 'Nauru' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PW', name: 'Palau' },
  { code: 'PA', name: 'Panama' },
  { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'LC', name: 'Saint Lucia' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  { code: 'WS', name: 'Samoa' },
  { code: 'SM', name: 'San Marino' },
  { code: 'ST', name: 'Sao Tome and Principe' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SN', name: 'Senegal' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SB', name: 'Solomon Islands' },
  { code: 'SO', name: 'Somalia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' },
  { code: 'SR', name: 'Suriname' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SY', name: 'Syria' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste' },
  { code: 'TG', name: 'Togo' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'TV', name: 'Tuvalu' },
  { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VU', name: 'Vanuatu' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'YE', name: 'Yemen' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
] as { code: string; name: string }[]).map((c) => {
  let dialCode = ''
  try { dialCode = `+${getCountryCallingCode(c.code as CountryCode)}` } catch { /* skip */ }
  return { ...c, dialCode }
})

// ── Flag icon — country-flag-icons SVG React components ───────────────────────

type FlagProps = { className?: string; title?: string }

function FlagIcon({ code, className }: { code: string; className?: string }) {
  const Comp = (AllFlags as Record<string, React.ComponentType<FlagProps>>)[code.toUpperCase()]
  if (!Comp) return <span className="text-base leading-none">🌐</span>
  return <Comp className={className ?? 'w-5 h-[14px] rounded-[2px]'} title={code} />
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseOptionalNumber(val: string | undefined): number | undefined {
  if (!val) return undefined
  const n = parseFloat(val)
  return isNaN(n) ? undefined : n
}

// ── Validation schema ─────────────────────────────────────────────────────────

const schema = z.object({
  name:              z.string().min(2, 'Name must be at least 2 characters'),
  email:             z.string().email('Invalid email address').optional().or(z.literal('')),
  phone:             z.string().optional().or(z.literal('')),
  address:           z.string().optional().or(z.literal('')),
  city:              z.string().optional().or(z.literal('')),
  postal_code:       z.string().optional().or(z.literal('')),
  nationality:       z.string().optional().or(z.literal('')),
  occupation:        z.string().optional().or(z.literal('')),
  language:          z.enum(['en', 'de']),
  notes:             z.string().optional().or(z.literal('')),
  date_of_birth:     z.string().optional().or(z.literal('')).refine(
    (val) => !val || new Date(val) <= new Date(),
    { message: 'Date of birth cannot be in the future' }
  ),
  current_weight_kg: z.string().optional().or(z.literal('')).refine(
    (val) => !val || (parseFloat(val) >= 0 && parseFloat(val) <= 500),
    { message: 'Weight must be between 0 and 500 kg' }
  ),
  height_cm:         z.string().optional().or(z.literal('')).refine(
    (val) => !val || (parseFloat(val) >= 0 && parseFloat(val) <= 300),
    { message: 'Height must be between 0 and 300 cm' }
  ),
  sickness:          z.string().optional().or(z.literal('')),
})

type Form = z.infer<typeof schema>

// ── Country Selector — searchable, shows SVG flags ───────────────────────────

function CountrySelector({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [query, setQuery]       = useState(value)
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState<Country | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!value) { setQuery(''); setSelected(null) } }, [value])

  const filtered = query.trim()
    ? COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : COUNTRIES.slice(0, 8)

  const select = useCallback((c: Country) => {
    setSelected(c); setQuery(c.name); setOpen(false); onChange(c.name)
  }, [onChange])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none">
          {selected
            ? <FlagIcon code={selected.code} className="w-5 h-[14px] rounded-[2px]" />
            : <span className="text-slate-400 text-sm">🌐</span>}
        </span>
        <input
          type="text"
          value={query}
          className="input pl-9"
          placeholder="Search nationality…"
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!e.target.value) { setSelected(null); onChange('') }
          }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((c) => (
            <li
              key={c.code}
              className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
              onMouseDown={(e) => { e.preventDefault(); select(c) }}
            >
              <FlagIcon code={c.code} className="w-5 h-[14px] rounded-[2px] shrink-0" />
              <span className="flex-1 text-[var(--text-primary)]">{c.name}</span>
              <span className="text-xs text-slate-400">{c.dialCode}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Phone Field — intl-tel-input v29 with flag dropdown ──────────────────────

function IntlPhoneField({
  onChange,
  error,
}: {
  onChange: (v: string) => void
  error?: string
}) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const itiRef      = useRef<{ getNumber: () => string; isValidNumber: () => boolean | null; destroy: () => void } | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [phoneError, setPhoneError] = useState<string | null>(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return

    let iti: typeof itiRef.current = null
    let cancelled = false

    const onInput = () => {
      if (!iti) return
      const num   = iti.getNumber()
      const valid = iti.isValidNumber()
      onChangeRef.current(num)
      setPhoneError(num && valid === false ? 'Invalid phone number for the selected country' : null)
    }

    import('intl-tel-input').then(({ default: intlTelInput }) => {
      if (cancelled || !el) return
      iti = intlTelInput(el, {
        loadUtils:     () => import('intl-tel-input/utils'),
        separateDialCode: true,
        initialCountry:   'us',
        countryOrder:     ['us', 'gb', 'de', 'fr', 'it', 'es', 'ae', 'sa'],
        strictMode:       true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any) as typeof itiRef.current
      itiRef.current = iti
      el.addEventListener('input',         onInput)
      el.addEventListener('countrychange', onInput)
    })

    return () => {
      cancelled = true
      el.removeEventListener('input',         onInput)
      el.removeEventListener('countrychange', onInput)
      itiRef.current?.destroy()
      itiRef.current = null
    }
  }, []) // empty deps — callbacks accessed via ref

  return (
    <div>
      <label className="label">Phone</label>
      <input ref={inputRef} type="tel" className="input" placeholder="Phone number" />
      {(phoneError || error) && (
        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <AlertCircle size={11} /> {phoneError || error}
        </p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewClientPage() {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [emailSent, setEmailSent]         = useState(false)
  const [copied, setCopied]               = useState(false)
  const [submitError, setSubmitError]     = useState<string | null>(null)
  const [checking, setChecking]           = useState(false)

  // Real-time email MX check — calls /api/validate-email (node-email-verifier)
  const [emailState, setEmailState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const emailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const createClient = useCreateClient()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', email: '', phone: '', address: '', city: '',
      postal_code: '', nationality: '', occupation: '', language: 'en',
      notes: '', date_of_birth: '', current_weight_kg: '', height_cm: '', sickness: '',
    },
  })

  useEffect(() => () => { if (emailTimerRef.current) clearTimeout(emailTimerRef.current) }, [])

  const checkEmailValidity = useCallback(async (email: string) => {
    if (!email) { setEmailState('idle'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailState('invalid'); return }
    setEmailState('checking')
    try {
      const res  = await fetch('/api/validate-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      setEmailState(data.valid ? 'valid' : 'invalid')
    } catch {
      setEmailState('idle')
    }
  }, [])

  const { onChange: emailOnChange, ...emailRegisterProps } = register('email')

  const onSubmit = async (data: Form) => {
    setSubmitError(null)

    // Duplicate client check before creating
    if (data.email || data.phone) {
      setChecking(true)
      try {
        const exists = await clientsApi.checkExists({
          email: data.email || undefined,
          phone: data.phone || undefined,
        })
        if (exists.email) { setSubmitError('A client with this email already exists.'); return }
        if (exists.phone) { setSubmitError('A client with this phone number already exists.'); return }
      } catch { /* non-fatal */ } finally { setChecking(false) }
    }

    const payload: Partial<Client> = {
      name:              data.name,
      email:             data.email         || undefined,
      phone:             data.phone         || undefined,
      address:           data.address       || undefined,
      city:              data.city          || undefined,
      postal_code:       data.postal_code   || undefined,
      nationality:       data.nationality   || undefined,
      occupation:        data.occupation    || undefined,
      language:          data.language,
      notes:             data.notes         || undefined,
      date_of_birth:     data.date_of_birth || undefined,
      current_weight_kg: parseOptionalNumber(data.current_weight_kg),
      height_cm:         parseOptionalNumber(data.height_cm),
      sickness:          data.sickness      || undefined,
    }

    try {
      const res = await createClient.mutateAsync(payload)
      setGeneratedCode(res.data.login_code)
      setEmailSent(!!res.data.email_sent)
    } catch (err: unknown) {
      const e      = err as { response?: { data?: { message?: string; errors?: { upgrade_required?: boolean } }; status?: number } }
      const status = e?.response?.status
      const msg    = e?.response?.data?.message
      const upgradeRequired = e?.response?.data?.errors?.upgrade_required
      if (status === 409 || (msg && /exist/i.test(msg))) {
        setSubmitError('User already exists. A client with this email or phone is already registered.')
      } else if (status === 403 && upgradeRequired) {
        setSubmitError(msg || 'Client limit reached. Upgrade your plan to add more clients.')
      } else if (status !== 401 && status !== 403) {
        setSubmitError(msg || 'Failed to create client. Please try again.')
      }
      // 401 and non-upgrade 403 are handled globally by the Axios interceptor
    }
  }

  const copy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (generatedCode) {
    return (
      <DashboardLayout>
        <div className="mx-auto p-4 sm:p-6 lg:p-8">
          <div className="card p-6 sm:p-8 text-center">
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

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="mx-auto p-4 sm:p-6 lg:p-8">
        <Link href="/clients" className="flex items-center gap-1 text-sm text-gray-100 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <h1 className="text-2xl font-semibold text-gray-100 mb-6">Add New Client</h1>

        <div className="card p-4 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Name */}
            <div>
              <label className="label">Full Name *</label>
              <input {...register('name')} className="input" placeholder="Full Name" />
              {errors.name && (
                <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle size={11} /> {errors.name.message}
                </p>
              )}
            </div>

            {/* Email (real-time MX check) + Phone (intl-tel-input) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <input
                    {...emailRegisterProps}
                    type="email"
                    className="input pr-8"
                    placeholder="client@email.com"
                    onChange={(e) => {
                      emailOnChange(e)
                      if (emailTimerRef.current) clearTimeout(emailTimerRef.current)
                      emailTimerRef.current = setTimeout(() => checkEmailValidity(e.target.value), 700)
                    }}
                  />
                  {emailState === 'checking' && (
                    <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                  {emailState === 'valid' && (
                    <CheckCircle2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                  {emailState === 'invalid' && (
                    <AlertCircle size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-400" />
                  )}
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle size={11} /> {errors.email.message}
                  </p>
                )}
                {!errors.email && emailState === 'invalid' && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle size={11} /> Email domain has no valid MX records
                  </p>
                )}
              </div>

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <IntlPhoneField onChange={field.onChange} error={errors.phone?.message} />
                )}
              />
            </div>

            {/* Address */}
            <div>
              <label className="label">Address</label>
              <input {...register('address')} className="input" placeholder="Street address" />
            </div>

            {/* City + Postal */}
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

            {/* Nationality (SVG flags) + Occupation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nationality</label>
                <Controller
                  name="nationality"
                  control={control}
                  render={({ field }) => (
                    <CountrySelector value={field.value ?? ''} onChange={field.onChange} />
                  )}
                />
              </div>
              <div>
                <label className="label">Occupation</label>
                <input {...register('occupation')} className="input" placeholder="Occupation" />
              </div>
            </div>

            {/* DOB + Weight + Height */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Date of Birth</label>
                <input {...register('date_of_birth')} type="date" className="input" />
                {errors.date_of_birth && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle size={11} /> {errors.date_of_birth.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input {...register('current_weight_kg')} type="number" step="0.1" min="0" className="input" placeholder="e.g. 75" />
                {errors.current_weight_kg && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle size={11} /> {errors.current_weight_kg.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Height (cm)</label>
                <input {...register('height_cm')} type="number" step="1" min="0" className="input" placeholder="e.g. 180" />
                {errors.height_cm && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle size={11} /> {errors.height_cm.message}
                  </p>
                )}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="label">Language</label>
              <select {...register('language')} className="input">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            {/* Sickness */}
            <div>
              <label className="label">Sickness / Health Conditions (optional)</label>
              <input {...register('sickness')} className="input" placeholder="Any illnesses, allergies, or health notes…" />
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes</label>
              <textarea {...register('notes')} className="input h-24 resize-none" placeholder="Goals, injuries, preferences…" />
            </div>

            {/* Error banner */}
            {submitError && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || checking}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {(isSubmitting || checking) && <Loader2 size={16} className="animate-spin" />}
              {checking ? 'Checking…' : isSubmitting ? 'Creating…' : 'Create Client & Generate Code'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

