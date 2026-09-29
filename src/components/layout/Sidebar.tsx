"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore, canViewTeam } from "@/store/auth";
import { useSubscription } from "@/hooks/useSubscription";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Salad,
  Calendar,
  Settings,
  LogOut,
  Menu,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Video,
  Building2,
} from "lucide-react";

function useCanViewTeam(): boolean {
  const { isStaff, staffRole, hasHydrated } = useAuthStore();
  if (!hasHydrated) return false;
  return canViewTeam(isStaff, staffRole);
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/workout-plans", label: "Workout Plans", icon: Dumbbell },
  { href: "/nutrition-plans", label: "Nutrition", icon: Salad },
  { href: "/checkins", label: "Schedule", icon: Calendar },
  { href: "/coaching-sessions", label: "1-on-1 Sessions", icon: Video },
  { href: "/settings", label: "Settings", icon: Settings },
];

function useCanManageBilling(): boolean {
  const { isStaff, staffRole, hasHydrated } = useAuthStore();
  if (!hasHydrated) return false;
  if (!isStaff) return true; // owner (legacy coach)
  return staffRole === "admin";
}

interface SidebarContentProps {
  onClose?: () => void;
  collapsed?: boolean;
}

function SidebarContent({ onClose, collapsed = false }: SidebarContentProps) {
  const path = usePathname();
  const { coach, staff, isStaff, logout, hasHydrated } = useAuthStore();
  const { data: subscription } = useSubscription();
  const canManageBilling = useCanManageBilling();
  const canViewTeam = useCanViewTeam();

  const TIER_LABEL: Record<string, { label: string; color: string }> = {
    none: { label: "No Plan", color: "#888780" },
    free: { label: "Billing", color: "#888780" },
    pro: { label: "Pro", color: "#2A96AD" },
    business: { label: "Business", color: "#8B5CF6" },
  };
  const tierInfo = TIER_LABEL[subscription?.tier ?? "free"];

  const brandIcon = (
    <img
      src="/img/360fit-bg.png"
      alt="360Fit"
      className="w-8 h-8 rounded-lg object-cover"
    />
  );

  return (
    <div className="flex flex-col h-full">
      {/* ── Brand ── */}
      <div
        className={cn(
          "flex items-center border-b border-white/10 dark:border-white/[0.08]",
          collapsed ? "justify-center px-3 py-4" : "justify-between px-5 py-5",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            {brandIcon}
            <span className="font-semibold text-[var(--sidebar-text)] text-lg tracking-tight">
              360Fit
            </span>
          </div>
        )}
        {collapsed && brandIcon}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="section-title text-[var(--sidebar-text-secondary)] mb-3">
            Main Menu
          </p>
        )}
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href);
          return (
            <motion.div
              key={href}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 text-base font-medium transition-all duration-150",
                  collapsed ? "justify-center px-2" : "",
                  active
                    ? "bg-[var(--sidebar-text)]/10 text-[var(--sidebar-text)]"
                    : "text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-text)]/5 hover:text-[var(--sidebar-text)]",
                )}
                tabIndex={0}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
                {!collapsed && active && (
                  <span className="ml-auto w-1.5 h-1.5 bg-[var(--sidebar-text)]/60 opacity-80" />
                )}
              </Link>
            </motion.div>
          );
        })}

        {canViewTeam && (
          <motion.div
            key="team"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/settings/team"
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-4 py-3 text-base font-medium transition-all duration-150",
                collapsed ? "justify-center px-2" : "",
                path.startsWith("/settings/team")
                  ? "bg-[var(--sidebar-text)]/10 text-[var(--sidebar-text)]"
                  : "text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-text)]/5 hover:text-[var(--sidebar-text)]",
              )}
              tabIndex={0}
              title={collapsed ? "Team" : undefined}
            >
              <Building2 className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Team</span>}
              {!collapsed && path.startsWith("/settings/team") && (
                <span className="ml-auto w-1.5 h-1.5 bg-[var(--sidebar-text)]/60 opacity-80" />
              )}
            </Link>
          </motion.div>
        )}
      </nav>

      {/* ── Plan badge ── */}
      {canManageBilling && (
        <div
          className={cn(
            "border-t border-white/10 dark:border-white/[0.08]",
            collapsed ? "px-2 py-2" : "px-3 py-2",
          )}
        >
          <Link
            href="/billing"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2 px-2 py-2 hover:bg-white/10 dark:hover:bg-white/[0.06] transition-colors",
              collapsed ? "justify-center" : "",
            )}
            title={collapsed ? `Plan: ${tierInfo?.label}` : undefined}
          >
            <CreditCard
              className="w-4 h-4 flex-shrink-0"
              style={{ color: tierInfo?.color }}
            />
            {!collapsed && (
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: tierInfo?.color }}
              >
                {tierInfo?.label}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* ── Profile ── */}
      <div
        className={cn(
          "border-t border-white/10 dark:border-white/[0.08]",
          collapsed ? "px-2 py-3" : "px-3 py-4",
        )}
      >
        <div
          className={cn(
            "flex items-center hover:bg-white/10 dark:hover:bg-white/[0.06] transition-colors",
            collapsed ? "justify-center p-2" : "gap-3 px-2 py-2",
          )}
        >
          {hasHydrated ? (
            <Avatar
              name={isStaff ? staff?.name : coach?.name}
              surname={isStaff ? undefined : coach?.surname}
              photo={isStaff ? undefined : coach?.profile_photo}
              size="w-9 h-9"
              variant="colored"
              shape="squircle"
              className="ring-2 ring-[var(--sidebar-bdr)]"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-white/10 animate-pulse flex-shrink-0" />
          )}
          {!collapsed && hasHydrated && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--sidebar-text)] truncate leading-snug">
                  {isStaff ? staff?.name : coach?.name}
                </p>
                <p className="text-xs text-[var(--sidebar-text-secondary)] truncate">
                  {isStaff ? staff?.email : coach?.email}
                </p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="text-[var(--sidebar-text-secondary)] hover:text-red-500 transition-colors p-1.5 hover:bg-red-500/10 flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
          {!collapsed && !hasHydrated && (
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-3.5 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-2.5 w-28 bg-white/5 rounded animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setCollapsed(JSON.parse(saved));
  }, []);

  // Save collapsed state
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
  };

  return (
    <>
      {/* Mobile hamburger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-[#192230] text-[var(--text-primary)] border border-slate-200 dark:border-white/10"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </motion.button>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r"
            style={{
              backgroundColor: "var(--sidebar-bg)",
              borderColor: "var(--sidebar-bdr)",
            }}
            tabIndex={-1}
            aria-modal={mobileOpen}
            role="dialog"
          >
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop collapsible sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 256 }}
        className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-30 border-r overflow-hidden"
        style={{
          backgroundColor: "var(--sidebar-bg)",
          borderColor: "var(--sidebar-bdr)",
        }}
      >
        <SidebarContent collapsed={collapsed} />

        {/* Collapse toggle button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleCollapsed}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-[#192230] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white z-10"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </motion.button>
      </motion.aside>

      {/* Spacer for main content */}
      <div
        className="hidden md:block flex-shrink-0"
        style={{ width: collapsed ? 80 : 256 }}
      />
    </>
  );
}
