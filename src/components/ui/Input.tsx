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
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      <input
        ref={ref}
        className={clsx(
          'block w-full px-3.5 py-2.5 text-sm  rounded-sm   transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-cyan-700/20 focus:border-blue-500',
          'placeholder:text-slate-400',
          error
            ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-400/20 focus:border-red-400'
            : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';
