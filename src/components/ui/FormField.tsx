'use client'

import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({ label, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-sm font-medium text-[var(--text-secondary)] ">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

/* ── Text Input ────────────────────────────────────────────────────────────── */
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function TextInput({ error, className, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 text-sm border bg-white dark:bg-white/[0.04] text-[var(--text-primary)]  placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700',
        error
          ? 'border-red-300 dark:border-red-500/50'
          : 'border-[var(--border)] ',
        className,
      )}
      {...props}
    />
  )
}

/* ── Textarea ──────────────────────────────────────────────────────────────── */
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function TextArea({ error, className, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn(
        'w-full px-3 py-2 text-sm border bg-white dark:bg-white/[0.04] text-[var(--text-primary)]  placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors resize-none',
        'focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700',
        error
          ? 'border-red-300 dark:border-red-500/50'
          : 'border-[var(--border)] ',
        className,
      )}
      {...props}
    />
  )
}

/* ── Select ────────────────────────────────────────────────────────────────── */
interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectInput({ error, options, placeholder, className, ...props }: SelectInputProps) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 text-sm border bg-white dark:bg-white/[0.04] text-[var(--text-primary)]  transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700',
        error
          ? 'border-red-300 dark:border-red-500/50'
          : 'border-[var(--border)] ',
        className,
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

/* ── Page Header ───────────────────────────────────────────────────────────── */
interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 bg-brand-950 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] ">{title}</h1>
          {subtitle && <p className="text-[var(--text-tertiary)] text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
