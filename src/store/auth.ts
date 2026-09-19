"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Coach, StaffMember, StaffRole } from "@/types";
import {
  setAuthInvalidationCallback,
  setAuthTokenGetter,
  setTokenRefreshCallback,
} from "@/lib/api/client";
import api from "@/lib/api/client";
import { resolveBaseUrl } from "@/lib/env";

/* ── Logout callbacks ─────────────────────────────────────────────────────── */
const logoutCallbacks = new Set<() => void>();

export function onLogout(callback: () => void) {
  logoutCallbacks.add(callback);
  return () => {
    logoutCallbacks.delete(callback);
  };
}

function runLogoutCallbacks() {
  logoutCallbacks.forEach((cb) => {
    try {
      cb();
    } catch (error) {
      console.error("Logout callback failed", error);
    }
  });
}

/* ── JWT payload decoder (no verification — just reads claims) ─────────────── */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* ── Store ────────────────────────────────────────────────────────────────── */
interface AuthState {
  coach: Coach | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  hasHydrated: boolean;
  isStaff: boolean;
  staffRole: StaffRole | null;
  staff: StaffMember | null;
  setCoach: (coach: Coach, token?: string) => void;
  setStaff: (staff: StaffMember, token?: string) => void;
  updateCoach: (coach: Coach) => void;
  logout: () => void;
  clearAuth: () => void;
  setToken: (token: string) => void;
  refreshAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      coach: null,
      isAuthenticated: false,
      accessToken: null,
      hasHydrated: false,
      isStaff: false,
      staffRole: null,
      staff: null,
      setCoach: (coach, token) => {
        set({
          coach,
          isAuthenticated: true,
          accessToken: token ?? null,
          isStaff: false,
          staffRole: null,
          staff: null,
        });
      },
      setStaff: (staff, token) => {
        set({
          staff,
          isAuthenticated: true,
          accessToken: token ?? null,
          isStaff: true,
          staffRole: staff.role,
          coach: null,
        });
      },
      updateCoach: (coach) => {
        set({ coach, isAuthenticated: true });
      },
      setToken: (token) => {
        const payload = decodeJwtPayload(token);
        const updates: Partial<AuthState> = { accessToken: token };
        if (payload && typeof payload.staff_role === "string") {
          updates.staffRole = payload.staff_role as StaffRole;
        }
        set(updates);
      },
      logout: () => {
        const token = get().accessToken;
        fetch(`${resolveBaseUrl()}/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).catch(() => {});
        runLogoutCallbacks();
        set({
          coach: null,
          isAuthenticated: false,
          accessToken: null,
          isStaff: false,
          staffRole: null,
          staff: null,
        });
      },
      clearAuth: () => {
        runLogoutCallbacks();
        set({
          coach: null,
          isAuthenticated: false,
          accessToken: null,
          isStaff: false,
          staffRole: null,
          staff: null,
        });
      },
      refreshAccessToken: async () => {
        try {
          const res = await api.post("/auth/refresh");
          const token = res.data?.data?.access_token ?? null;
          if (token) {
            set({ accessToken: token });
          }
          return token;
        } catch {
          get().clearAuth();
          return null;
        }
      },
    }),
    {
      name: "coach-auth",
      partialize: (s) => ({
        coach: s.coach,
        isAuthenticated: s.isAuthenticated,
        isStaff: s.isStaff,
        staffRole: s.staffRole,
        staff: s.staff,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
        }
      },
    },
  ),
);

// Register callback for API client to clear auth on 403/refresh failure
setAuthInvalidationCallback(() => {
  useAuthStore.getState().clearAuth();
});

// Register token getter for API client request interceptor
setAuthTokenGetter(() => useAuthStore.getState().accessToken);

// Register callback so interceptor can update token after refresh
setTokenRefreshCallback((token) => {
  useAuthStore.getState().setToken(token);
});

// Shared Team-visibility rule: owners (legacy coach) or admin-role staff only.
export function canViewTeam(
  isStaff: boolean,
  staffRole: StaffRole | null,
): boolean {
  return !isStaff || staffRole === "admin";
}
