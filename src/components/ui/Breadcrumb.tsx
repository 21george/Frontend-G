"use client";

import type { ReactNode } from "react";

export type FilterBreadcrumbItem<T extends string = string> = {
  key: T;
  label: string;
  count?: number;
  icon?: ReactNode;
  disabled?: boolean;
};

type FilterBreadcrumbProps<T extends string = string> = {
  items: FilterBreadcrumbItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export default function FilterBreadcrumb<T extends string = string>({
  items,
  value,
  onChange,
  className = "",
}: FilterBreadcrumbProps<T>) {
  return (
    <div
      role="group"
      aria-label="Filter options"
      className={`flex items-center min-w-0 max-w-full overflow-x-auto ${className}`}
    >
      {items.map((item, index) => {
        const isActive = value === item.key;
        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={isActive}
            disabled={item.disabled}
            onClick={() => onChange(item.key)}
            className={`
              group relative
              flex h-10 items-center
              px-3
              text-xs font-semibold
              whitespace-nowrap
              outline-none
              transition-colors duration-200
              disabled:pointer-events-none
              disabled:opacity-50

              ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-white text-[var(--text-secondary)] dark:bg-neutral-900"
              }

              ${isFirst ? "rounded-l-[4px] pl-4" : ""}
              ${isLast ? "rounded-r-[4px] pr-4" : "mr-[20px]"}

              /* LEFT CHEVRON */
              before:absolute
              before:top-0
              before:-left-[20px]
              before:z-10
              before:h-0
              before:w-0
              before:border-y-[20px]
              before:border-l-[10px]
              before:border-y-transparent

              ${
                isFirst
                  ? "before:hidden"
                  : isActive
                    ? "before:border-l-brand-600"
                    : "before:border-l-white dark:before:border-l-neutral-900"
              }

              /* RIGHT CHEVRON */
              after:absolute
              after:left-full
              after:top-0
              after:z-20
              after:h-0
              after:w-0
              after:border-y-[20px]
              after:border-l-[10px]
              after:border-y-transparent

              ${
                isLast
                  ? "after:hidden"
                  : isActive
                    ? "after:border-l-brand-600"
                    : "after:border-l-white dark:after:border-l-neutral-900"
              }

              ${
                !isActive
                  ? `
                    hover:bg-brand-50
                    dark:hover:bg-brand-950/40
                    hover:text-brand-600
                    dark:hover:text-brand-400
                    hover:after:border-l-brand-50
                    dark:hover:after:border-l-brand-950/40
                    hover:before:border-l-brand-50
                    dark:hover:before:border-l-brand-950/40
                    focus-visible:bg-brand-50
                    dark:focus-visible:bg-brand-950/40
                  `
                  : `
                    focus-visible:ring-2
                    focus-visible:ring-brand-500
                    focus-visible:ring-offset-2
                  `
              }
            `}
          >
            <span className="relative z-30 flex items-center gap-2">
              {item.icon && (
                <span className="flex items-center justify-center">
                  {item.icon}
                </span>
              )}

              <span>{item.label}</span>

              {item.count !== undefined && (
                <span
                  className={`
                    inline-flex
                    h-5
                    min-w-[1.25rem]
                    items-center
                    justify-center
                    rounded-full
                    px-1
                    text-[10px]
                    font-bold
                    ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }
                  `}
                >
                  {item.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
