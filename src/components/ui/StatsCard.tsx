import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'amber';
  sub?: string;
  trend?: { value: number; label: string };
}

const iconColors = {
  blue:   'bg-brand-600 text-white',
  green:  'bg-emerald-500 text-white',
  purple: 'bg-purple-500 text-white',
  orange: 'bg-orange-500 text-white',
  amber:  'bg-amber-500 text-white',
};

export function StatsCard({ title, value, icon: Icon, color = 'blue', sub, trend }: Props) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={cn('w-12 h-12 flex items-center justify-center flex-shrink-0', iconColors[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 truncate">{title}</p>
        <p className="text-2xl font-semibold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        {trend && (
          <p className={cn('text-xs mt-0.5 font-medium', trend.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
