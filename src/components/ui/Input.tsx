import { clsx } from 'clsx';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      )}
      <input
        ref={ref}
        className={clsx(
          'block w-full px-3.5 py-2.5 text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700',
          'placeholder:text-slate-400',
          error
            ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-400/20 focus:border-red-400'
            : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 dark:border-white/[0.08] dark:bg-[var(--bg-subtle)] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/[0.14]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';
