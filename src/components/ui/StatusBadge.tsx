import { clsx } from "clsx";

export interface StatusVariant {
  label: string;
  dot?: string;
  className: string;
}

interface StatusBadgeProps {
  status: string;
  variantMap: Record<string, StatusVariant>;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  status,
  variantMap,
  size = "sm",
  className,
}: StatusBadgeProps) {
  const config = variantMap[status] ?? variantMap.default;
  if (!config) return null;

  const sizeClasses =
    size === "md"
      ? "px-2.5 py-1 text-xs"
      : "px-2 py-0.5 text-[11px]";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-semibold rounded-full border",
        sizeClasses,
        config.className,
        className,
      )}
    >
      {config.dot && (
        <span className={clsx("w-1.5 h-1.5 rounded-full", config.dot)} />
      )}
      {config.label}
    </span>
  );
}
