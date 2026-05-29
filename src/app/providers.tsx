"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as ReduxProvider } from "react-redux";
import { useState, useEffect } from "react";
import { uiStore } from "@/store/ui";
import { useThemeStore } from "@/store/theme";
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

  return (
    <ReduxProvider store={uiStore}>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        {children}
        <TrialReminderModal />
      </QueryClientProvider>
    </ReduxProvider>
  );
}
