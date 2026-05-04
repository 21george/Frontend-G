import { clsx } from 'clsx';

interface CardProps { children: React.ReactNode; className?: string; }

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('border border-[var(--border)] bg-[var(--bg-card)]', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={clsx('px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={clsx('px-6 py-5', className)}>{children}</div>;
}
