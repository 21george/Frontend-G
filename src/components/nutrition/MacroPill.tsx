import { cn } from "@/lib/utils";

interface MacroPillProps {
  icon: React.ReactNode;
  value: number;
  unit: string;
  color?: string;
  bg?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MacroPill({
  icon,
  value,
  unit,
  color = "text-orange-500",
  bg = "bg-orange-50 dark:bg-orange-900/20",
  label,
  size = "sm",
  className,
}: MacroPillProps) {
  const sizeCls =
    size === "lg"
      ? "flex-col py-3 px-4 gap-1"
      : size === "md"
        ? "py-2 px-2.5 gap-1.5"
        : "px-2.5 py-1.5 gap-1.5";

  const textCls =
    size === "lg"
      ? "text-lg"
      : size === "md"
        ? "text-sm"
        : "text-[11px]";

  const unitCls =
    size === "lg"
      ? "text-xs ml-0.5"
      : size === "md"
        ? "text-xs ml-0.5"
        : "text-[10px] ml-0.5";

  return (
    <div className={cn(`flex items-center rounded-md ${sizeCls} ${bg}`, className)}>
      <span className={color}>{icon}</span>
      <div className={size === "lg" ? "flex flex-col items-center" : ""}>
        <span className={cn(`font-semibold ${color} ${textCls}`)}>
          {Math.round(value)}
          <span className={cn(`font-normal ${unitCls}`)}>{unit}</span>
        </span>
        {label && (
          <span className="text-[10px] text-[var(--text-secondary)] dark:text-[var(--text-secondary)] uppercase tracking-wide">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
