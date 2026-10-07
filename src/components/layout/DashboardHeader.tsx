"use client";
import { useMemo, useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LucideIcon,
  Upload,
  Sun,
  Moon,
  User,
  UserPlus,
  Calendar,
  Video,
  FileText,
  ChevronRight,
} from "lucide-react";
import { NearbyGymsButton } from "./NearbyGyms";
import NotificationsButton from "@/components/notifications";
import WeatherForecast from "@/components/weather";
import { Avatar } from "@/components/ui/Avatar";
import { GlobalSearch } from "@/components/GlobalSearch";

interface QuickAction {
  href?: string;
  onClick?: () => void;
  label: string;
  icon: LucideIcon;
  color: string;
}

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  quickActions?: QuickAction[];
  showGreeting?: boolean;
}

function getGreetingLabel(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function useClientDateLabel() {
  const [label, setLabel] = useState(() => {
    const now = new Date();
    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
    const dayNum = now.getDate();
    const monthName = now.toLocaleDateString("en-US", { month: "long" });
    return `${dayName}, ${dayNum} ${monthName}`;
  });
  return label;
}

function useClientGreeting() {
  const [greeting, setGreeting] = useState(() => getGreetingLabel());
  return greeting;
}

function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className={`
        relative w-14 h-7 border transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-brand-700/40
        ${
          theme === "dark"
            ? "bg-slate-800 border-white/[0.12] rounded-xl"
            : "bg-[var(--bg-subtle)] border-[var(--border-hover)] rounded-xl"
        }
      `}
    >
      <Sun
        size={12}
        className={`absolute left-1.5 top-1/2 -translate-y-1/2  transition-opacity duration-200 ${theme === "dark" ? "opacity-30 text-neutral-400" : "opacity-100 text-amber-500"}`}
      />
      <Moon
        size={12}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${theme === "dark" ? "opacity-100 text-blue-300" : "opacity-30 text-slate-400"}`}
      />
      <span
        className={`
          absolute top-0.5 w-6 h-6 flex items-center justify-center
          transition-all duration-300 ease-in-out rounded-xl
          ${theme === "dark" ? "translate-x-7 bg-slate-700" : "translate-x-0.5 bg-white"}
        `}
      >
        {theme === "dark" ? (
          <Moon size={11} className="text-white" />
        ) : (
          <Sun size={11} className="text-amber-500" />
        )}
      </span>
    </button>
  );
}

export default function DashboardHeader({
  title,
  subtitle,
  quickActions,
  showGreeting = false,
}: DashboardHeaderProps) {
  const { coach, staff, isStaff, hasHydrated } = useAuthStore();
  const pathname = usePathname();
  const dateLabel = useClientDateLabel();
  const greeting = useClientGreeting();
  const userName = isStaff ? staff?.name : coach?.name;
  const userSurname = isStaff ? undefined : coach?.surname;
  const userEmail = isStaff ? staff?.email : coach?.email;
  const userPhoto = isStaff ? staff?.profile_photo : coach?.profile_photo;

  const safePath = pathname ?? "";

  const getPageTitle = () => {
    const path = safePath.split("/").pop() || "";
    const titleMap: Record<string, string> = {
      settings: "Settings",
      dashboard: "Dashboard",
      clients: "Clients",
      "workout-plans": "Workout Plans",
      "nutrition-plans": "Nutrition Plans",
      checkins: "Check-ins",
      "live-training": "Live Training",
      billing: "Manage Subscription",
      media: "Media",
      notifications: "Notifications",
      messages: "Messages",
    };
    return (
      titleMap[path] ||
      path.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
      "Dashboard"
    );
  };

  const pageTitle = getPageTitle();
  const heading = title ?? pageTitle;

  const defaultQuickActions = useMemo(() => {
    if (quickActions) return quickActions;

    const actions: QuickAction[] = [];

    if (safePath.startsWith("/workout-plans")) {
      actions.push(
        {
          href: "/workout-plans/new",
          label: "Create plan",
          icon: FileText,
          color:
            "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
        },
        {
          href: "/workout-plans/import",
          label: "Import Excel",
          icon: Upload,
          color:
            "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50",
        },
      );
    } else if (safePath.startsWith("/clients")) {
      actions.push({
        href: "/clients/new",
        label: "Add a client",
        icon: User,
        color:
          "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
      });
    } else if (safePath.startsWith("/nutrition-plans")) {
      actions.push({
        href: "/nutrition-plans/new",
        label: "Create plan",
        icon: FileText,
        color:
          "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
      });
    } else if (safePath.startsWith("/checkins")) {
      actions.push({
        href: "/checkins/new",
        label: "Book a check-in",
        icon: Calendar,
        color:
          "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
      });
    } else if (safePath.startsWith("/live-training")) {
      actions.push({
        href: "/live-training/new",
        label: "New Session",
        icon: Video,
        color:
          "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
      });
    } else if (safePath.startsWith("/coaching-sessions")) {
      actions.push({
        href: "/coaching-sessions/new",
        label: "New 1-on-1",
        icon: Video,
        color:
          "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400 dark:hover:bg-cyan-900/50",
      });
    } else if (safePath.startsWith("/media")) {
      actions.push({
        href: "/media",
        label: "Upload files",
        icon: Upload,
        color:
          "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
      });
    } else if (safePath.startsWith("/team")) {
      actions.push({
        href: "/team",
        label: "invite Team",
        icon: UserPlus,
        color:
          "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
      });
    }

    return actions;
  }, [quickActions, safePath]);

  const fullName = [userName, userSurname].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-3 sm:gap-4 mb-6 lg:mb-8">
      {/* Top row: title + actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <nav
            className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mb-1"
            aria-label="Breadcrumb"
          >
            <span className="text-blue-600 dark:text-blue-400 font-medium truncate">
              {heading}
            </span>
          </nav>
          {showGreeting && (
            <div className="mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#888780] dark:text-[#FAFAFA]/40 mb-0.5">
                {greeting
                  ? `Good ${greeting}, ${userName ?? "there"}`
                  : "Welcome"}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {dateLabel}
              </p>
            </div>
          )}
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            {heading}
          </h1>
          {subtitle && (
            <p className="text-slate-500 dark:text-neutral-200 text-xs sm:text-sm mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
          <div className="hidden sm:block">
            <GlobalSearch pathname={pathname} />
          </div>
          <div className="hidden md:block">
            <WeatherForecast />
          </div>
          <NotificationsButton />
          <div className="hidden lg:block">
            <NearbyGymsButton />
          </div>
          {defaultQuickActions.length > 0 &&
            defaultQuickActions.map(
              ({ href, onClick, label, icon: Icon, color }) => {
                const className = `inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs rounded-lg sm:rounded-xl font-medium transition-colors ${color}`;
                const content = (
                  <>
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </>
                );
                if (onClick) {
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={onClick}
                      className={className}
                    >
                      {content}
                    </button>
                  );
                }
                if (href) {
                  return (
                    <Link key={label} href={href} className={className}>
                      {content}
                    </Link>
                  );
                }
                return null;
              },
            )}
          <div className="rounded-sm">
            <ThemeToggle />
          </div>
          <Link
            href="/settings/edit"
            className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-white/[0.1] hover:opacity-80 transition-opacity"
          >
            {hasHydrated ? (
              <>
                <Avatar
                  name={userName}
                  surname={userSurname}
                  photo={userPhoto}
                  size="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12"
                  variant="colored"
                  shape="squircle"
                  className="ring-2 ring-white/10"
                />
                {fullName && (
                  <div className="hidden md:flex flex-col">
                    <span className="text-[12px] lg:text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
                      {fullName}
                    </span>
                    <span className="text-[10px] lg:text-[11px] text-slate-500 dark:text-neutral-400 leading-tight">
                      {userEmail}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-lg bg-white/10 animate-pulse" />
            )}
          </Link>
        </div>
      </div>

      {/* Invite staff banner — only for owners (not staff), hide on team page */}

      {/* Mobile search row */}
      <div className="sm:hidden">
        <GlobalSearch pathname={pathname} />
      </div>
    </div>
  );
}
