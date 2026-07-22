"use client";

import { motion } from "framer-motion";

const STEPS = [
  { n: 1 as const, label: "Profile" },
  { n: 2 as const, label: "Plan" },
  { n: 3 as const, label: "Payment" },
];

interface Props {
  currentStep: 1 | 2 | 3;
}

export function StepIndicator({ currentStep }: Props) {
  return (
    <nav aria-label="Registration progress" className="mb-6">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done = s.n < currentStep;
          const active = s.n === currentStep;
          return (
            <div key={s.n} className="flex-1 flex items-center gap-2">
              {/* Segment bar */}
              <div className="flex-1 relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{
                    width: done || active ? "100%" : "0%",
                    opacity: done ? 1 : active ? 1 : 0,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    active ? "bg-[#a3e635] shadow-[0_0_8px_rgba(163,230,53,0.5)]" : "bg-[#a3e635]/70"
                  }`}
                />
                {active && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(163,230,53,0.4), transparent)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </div>

              {/* Step label */}
              <span
                className={`text-[10px] tracking-widest uppercase font-semibold shrink-0 transition-colors duration-300 ${
                  done || active ? "text-[#a3e635]" : "text-white/20"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {s.label}
              </span>

              {/* Connector dot */}
              {i < STEPS.length - 1 && (
                <span
                  className={`w-1 h-1 rounded-full shrink-0 transition-colors duration-300 ${
                    done ? "bg-[#a3e635]" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
