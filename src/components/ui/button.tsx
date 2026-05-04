import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-[var(--btn-bg)] text-white hover:bg-[var(--btn-hover)] active:bg-[var(--btn-active)] focus-visible:ring-[var(--btn-bg)] ',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus-visible:ring-slate-300 dark:bg-white/[0.06] dark:text-slate-200 dark:border-white/[0.08] dark:hover:bg-white/[0.1] dark:hover:border-white/[0.14] dark:active:bg-white/[0.14]',
  danger:    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500',
  ghost:     'text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-200 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:active:bg-white/[0.1]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm ',
  md: 'px-4 py-2.5 text-sm ',
  lg: 'px-6 py-3 text-base ',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', loading, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin flex-shrink-0" />
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
