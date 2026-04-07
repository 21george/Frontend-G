import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', {
      green:  'bg-green-100 text-green-800',
      blue:   'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red:    'bg-red-100 text-red-800',
      gray:   'bg-gray-100 text-gray-700',
    }[variant])}>
      {children}
    </span>
  );
}
