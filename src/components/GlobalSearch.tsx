"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useId,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Search,
  X,
  User,
  Users,
  CalendarDays,
  Dumbbell,
  Apple,
  Video,
  Image as ImageIcon,
  Settings,
  MessageSquare,
  Bell,
  CreditCard,
  LayoutDashboard,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { useAllClients } from "@/hooks/useClients";
import { useStaffList } from "@/hooks/useStaff";
import { useAuthStore, canViewTeam } from "@/store/auth";
import type { Client, StaffMember } from "@/types";

interface SearchResult {
  id: string;
  type: "client" | "staff" | "page";
  title: string;
  subtitle?: string;
  href: string;
  icon?: React.ReactNode;
  photo?: string | null;
}

const STATIC_PAGES: Omit<SearchResult, "id">[] = [
  {
    type: "page",
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={16} />,
  },
  {
    type: "page",
    title: "Clients",
    href: "/clients",
    icon: <Users size={16} />,
  },
  {
    type: "page",
    title: "Workout Plans",
    href: "/workout-plans",
    icon: <Dumbbell size={16} />,
  },
  {
    type: "page",
    title: "Nutrition Plans",
    href: "/nutrition-plans",
    icon: <Apple size={16} />,
  },
  {
    type: "page",
    title: "Check-ins",
    href: "/checkins",
    icon: <CalendarDays size={16} />,
  },
  {
    type: "page",
    title: "Live Training",
    href: "/live-training",
    icon: <Video size={16} />,
  },
  {
    type: "page",
    title: "Media",
    href: "/media",
    icon: <ImageIcon size={16} />,
  },
  {
    type: "page",
    title: "Messages",
    href: "/messages",
    icon: <MessageSquare size={16} />,
  },
  {
    type: "page",
    title: "Notifications",
    href: "/notifications",
    icon: <Bell size={16} />,
  },
  {
    type: "page",
    title: "Settings — Billing",
    href: "/billing",
    icon: <CreditCard size={16} />,
  },
  {
    type: "page",
    title: "Profile Settings",
    href: "/settings/edit",
    icon: <Settings size={16} />,
  },
];

const TEAM_PAGE: Omit<SearchResult, "id"> = {
  type: "page",
  title: "Settings — Team",
  href: "/settings/team",
  icon: <Users size={16} />,
};

function useDebounce<T>(value: T, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type SearchScope = "clients" | "staff" | "all";

function getScope(pathname: string): SearchScope {
  if (pathname.startsWith("/clients")) return "clients";
  if (pathname.startsWith("/settings/team")) return "staff";
  return "all";
}

function getPlaceholder(scope: SearchScope): string {
  if (scope === "clients") return "Search clients…";
  if (scope === "staff") return "Search team members…";
  return "Search clients, team, pages…";
}

interface GlobalSearchProps {
  pathname: string;
}

export function GlobalSearch({ pathname }: GlobalSearchProps) {
  const router = useRouter();
  const scope = useMemo(() => getScope(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const activeOptionRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const debouncedQuery = useDebounce(query, 150);

  const { isStaff, staffRole } = useAuthStore();
  const canSeeTeam = canViewTeam(isStaff, staffRole);

  const { data: allClients, isLoading: clientsLoading } = useAllClients();
  const { data: staffList, isLoading: staffLoading } = useStaffList(1, {
    enabled: canSeeTeam,
  });

  const staticPages = useMemo(
    () => (canSeeTeam ? [...STATIC_PAGES, TEAM_PAGE] : STATIC_PAGES),
    [canSeeTeam],
  );

  const isLoading =
    (scope === "clients" && clientsLoading) ||
    (scope === "staff" && canSeeTeam && staffLoading) ||
    (scope === "all" && (clientsLoading || (canSeeTeam && staffLoading)));

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const out: SearchResult[] = [];

    if (!q) {
      // Show recent pages when empty
      return staticPages.slice(0, 6).map((p, i) => ({
        ...p,
        id: `page-${i}`,
      }));
    }

    if (scope === "clients" || scope === "all") {
      if (allClients?.length) {
        allClients.forEach((c: Client) => {
          if (
            c.name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.phone?.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q)
          ) {
            out.push({
              id: `client-${c.id}`,
              type: "client",
              title: c.name,
              subtitle: c.email || `ID #${c.id.slice(-4)}`,
              href: `/clients/${c.id}`,
              icon: <User size={16} />,
              photo: c.profile_photo_url,
            });
          }
        });
      }
    }

    if ((scope === "staff" || scope === "all") && canSeeTeam) {
      const staffItems = staffList?.data ?? [];
      if (staffItems.length) {
        staffItems.forEach((s: StaffMember) => {
          if (
            s.name?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q)
          ) {
            out.push({
              id: `staff-${s.id}`,
              type: "staff",
              title: s.name || s.email,
              subtitle: s.email,
              href: `/settings/team/${s.id}`,
              icon: <Briefcase size={16} />,
            });
          }
        });
      }
    }

    // Pages — always shown, but lower priority
    staticPages.forEach((p, i) => {
      if (p.title.toLowerCase().includes(q)) {
        out.push({ ...p, id: `page-${i}` });
      }
    });

    return out.slice(0, 12);
  }, [debouncedQuery, allClients, staffList, scope, canSeeTeam, staticPages]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // Keep the highlighted option visible when navigating by keyboard
  useEffect(() => {
    activeOptionRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        router.push(results[selectedIndex].href);
        setOpen(false);
        setQuery("");
      } else if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    },
    [results, selectedIndex, router],
  );

  // Global cmd+k shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const grouped = useMemo(() => {
    const map: Record<string, SearchResult[]> = {};
    for (const r of results) {
      const key = r.type;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, [results]);

  const groupLabels: Record<string, string> = {
    client: "Clients",
    staff: "Team Members",
    page: "Pages",
  };

  const groupOrder =
    scope === "clients"
      ? ["client", "page"]
      : scope === "staff"
        ? ["staff", "page"]
        : ["client", "staff", "page"];

  return (
    <div ref={containerRef} className="relative hidden md:block">
      {/* Animated Input */}
      <motion.div
        animate={{
          width: focused ? 384 : 240,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative"
      >
        <motion.div
          animate={{
            boxShadow: focused
              ? "0 0 0 4px rgba(19, 46, 53, 0.1)"
              : "0 0 0 0px rgba(19, 46, 53, 0)",
          }}
          transition={{ duration: 0.2 }}
          className="rounded-xl"
        >
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] dark:text-white/30"
            />
            <input
              ref={inputRef}
              type="text"
              aria-label={getPlaceholder(scope)}
              role="combobox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                open && results[selectedIndex]
                  ? `${listboxId}-option-${results[selectedIndex].id}`
                  : undefined
              }
              placeholder={getPlaceholder(scope)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setFocused(true);
                setOpen(true);
              }}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-9 py-2 bg-[var(--bg-page)] dark:bg-white/[0.03] border border-[var(--border)] dark:border-white/[0.08] rounded-xl text-sm text-[var(--text-primary)] dark:text-white placeholder:text-[var(--text-tertiary)] dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-400 transition-colors"
            />
            {query ? (
              <button
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] dark:text-white/30 hover:text-[var(--text-primary)] dark:hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--text-tertiary)] dark:text-white/20 hidden sm:block">
                ⌘K
              </kbd>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] dark:bg-[#0d1518] border border-[var(--border)] dark:border-white/[0.08] rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50"
          >
            {isLoading && debouncedQuery.trim() ? (
              <div className="p-6 text-center text-sm text-[var(--text-tertiary)]">
                Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  No results found
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div
                className="max-h-[60vh] overflow-y-auto py-2"
                role="listbox"
                id={listboxId}
                ref={listboxRef}
              >
                {groupOrder.map((group) => {
                  const items = grouped[group];
                  if (!items?.length) return null;
                  return (
                    <div key={group}>
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] dark:text-white/30">
                        {groupLabels[group]}
                      </div>
                      {items.map((item, idx) => {
                        const globalIdx = results.indexOf(item);
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <button
                            key={item.id}
                            id={`${listboxId}-option-${item.id}`}
                            ref={isSelected ? activeOptionRef : undefined}
                            role="option"
                            aria-selected={isSelected}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            onClick={() => {
                              router.push(item.href);
                              setOpen(false);
                              setQuery("");
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              isSelected
                                ? "bg-brand-50 dark:bg-brand-900/20"
                                : "hover:bg-[var(--bg-page)] dark:hover:bg-white/[0.03]"
                            }`}
                          >
                            {/* Icon or Avatar */}
                            {item.photo ? (
                              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-[var(--border)] to-[var(--text-tertiary)]">
                                <Image
                                  src={item.photo}
                                  alt={item.title}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  item.type === "client"
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
                                    : item.type === "staff"
                                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300"
                                      : "bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400"
                                }`}
                              >
                                {item.icon}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${isSelected ? "text-brand-700 dark:text-brand-300" : "text-[var(--text-primary)] dark:text-white"}`}
                              >
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className="text-xs text-[var(--text-tertiary)] truncate">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>

                            <ChevronRight
                              size={14}
                              className={`shrink-0 ${isSelected ? "text-brand-600 dark:text-brand-400" : "text-[var(--text-tertiary)]"}`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-[var(--border)] dark:border-white/[0.06] flex items-center justify-between text-[10px] text-[var(--text-tertiary)] dark:text-white/30">
              <div className="flex items-center gap-2">
                <span>
                  <kbd className="font-mono bg-[var(--bg-page)] dark:bg-white/[0.04] px-1 rounded">
                    ↑↓
                  </kbd>{" "}
                  to navigate
                </span>
                <span>
                  <kbd className="font-mono bg-[var(--bg-page)] dark:bg-white/[0.04] px-1 rounded">
                    ↵
                  </kbd>{" "}
                  to select
                </span>
              </div>
              <span>
                <kbd className="font-mono bg-[var(--bg-page)] dark:bg-white/[0.04] px-1 rounded">
                  esc
                </kbd>{" "}
                to close
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
