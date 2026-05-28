'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlowingCardProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

export function GlowingCard({ children, className, active = true }: GlowingCardProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-2xl',
        active && 'animate-energy-pulse motion-reduce:animate-none',
        className
      )}
    >
      {/* Gradient border via pseudo-element approach using a wrapper */}
      {active && (
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none motion-reduce:hidden"
          style={{
            background: 'linear-gradient(135deg, #a3e635 0%, #22d3ee 50%, #a3e635 100%)',
            opacity: 0.6,
          }}
        />
      )}
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden',
          active && 'bg-[#0a0a0a]'
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
