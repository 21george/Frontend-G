import { cn } from "@/lib/utils";

export interface ClientAvatarClient {
  id: string;
  name: string;
  profile_photo_url?: string | null;
}

interface ClientAvatarProps {
  client: ClientAvatarClient;
  size?: "xs" | "sm" | "md";
  className?: string;
  bordered?: boolean;
}

export function ClientAvatar({ client, size = "sm", className, bordered = true }: ClientAvatarProps) {
  const sizeCls =
    size === "xs"
      ? "w-6 h-6 text-[9px]"
      : size === "md"
        ? "w-10 h-10 text-sm"
        : "w-8 h-8 text-[10px]";

  const borderCls = bordered
    ? "border-2 border-white dark:border-[#121212]"
    : "";

  if (client.profile_photo_url) {
    return (
      <img
        src={client.profile_photo_url}
        alt={client.name}
        className={cn(`${sizeCls} rounded-full object-cover ${borderCls}`, className)}
        title={client.name}
      />
    );
  }

  return (
    <div
      className={cn(
        `${sizeCls} rounded-full ${borderCls} bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold`,
        className,
      )}
      title={client.name}
    >
      {client.name?.[0]?.toUpperCase() ?? "C"}
    </div>
  );
}

interface ClientAvatarStackProps {
  clients: ClientAvatarClient[];
  max?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function ClientAvatarStack({
  clients,
  max = 3,
  size = "sm",
  className,
}: ClientAvatarStackProps) {
  const visible = clients.slice(0, max);
  const remaining = clients.length - max;
  const sizeCls =
    size === "xs"
      ? "w-6 h-6 text-[9px]"
      : size === "md"
        ? "w-10 h-10 text-sm"
        : "w-8 h-8 text-[10px]";

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visible.map((c) => (
        <ClientAvatar key={c.id} client={c} size={size} bordered />
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeCls} rounded-full border-2 border-white dark:border-[#121212] bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold text-slate-600 dark:text-slate-300`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
