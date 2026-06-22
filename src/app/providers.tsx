"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as ReduxProvider } from "react-redux";
import { useState, useEffect } from "react";
import { uiStore, closeModal } from "@/store/ui";
import { useThemeStore } from "@/store/theme";
import { useSubscriptionStore } from "@/store/subscription";
import { onLogout } from "@/store/auth";
import { TrialReminderModal } from "@/components/subscription/TrialReminderModal";

function ThemeSync() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [theme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // 1 min: data considered fresh
            gcTime: 5 * 60_000, // 5 min: keep unused data in cache
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    const unsubscribe = onLogout(() => {
      // Clear React Query cache (server state / memory)
      queryClient.clear();
      // Close any open Redux modals
      uiStore.dispatch(closeModal());
      // Clear subscription onboarding state
      useSubscriptionStore.getState().clearState();
      // Remove trial-reminder timestamp so next user sees it fresh
      localStorage.removeItem("trial_reminder_dismissed_until");
    });
    return unsubscribe;
  }, [queryClient]);

  return (
    <ReduxProvider store={uiStore}>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        {children}
        <TrialReminderModal />
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ReduxProvider>
  );
}
