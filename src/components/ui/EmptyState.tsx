import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  const isValidElement = React.isValidElement(icon);
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-[var(--bg-subtle)] flex items-center justify-center mb-4">
        {isValidElement ? (
          <span className="w-8 h-8 text-[var(--text-tertiary)] flex items-center justify-center">
            {icon}
          </span>
        ) : (
          <span className="w-8 h-8 text-[var(--text-tertiary)] flex items-center justify-center">
            {React.createElement(icon as LucideIcon, { className: 'w-8 h-8' })}
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--text-secondary)] max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
