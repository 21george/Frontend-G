"use client";

import { Check } from "lucide-react";

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
      <ol className="flex items-center w-full" role="list">
        {STEPS.map((s, i) => {
          const done = s.n < currentStep;
          const active = s.n === currentStep;
          return (
            <li key={s.n} className="relative flex-1 flex items-center">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0 transition-colors ${
                    done
                      ? "bg-blue-600 text-white"
                      : active
                        ? "border-2 border-blue-600 text-blue-600 bg-white dark:bg-[#181818]"
                        : "border-2 border-[var(--border)] text-[var(--text-tertiary)] bg-white dark:bg-[#181818]"
                  }`}
                >
                  {done ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : (
                    s.n
                  )}
                </span>
                <span
                  className={`hidden sm:block text-xs font-medium ${
                    active || done
                      ? "text-blue-600"
                      : "text-[var(--text-tertiary)]"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div aria-hidden className="flex-1 h-px mx-3">
                  <div
                    className={`h-full transition-all duration-500 ${
                      s.n < currentStep ? "bg-blue-600" : "bg-[var(--border)]"
                    }`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
