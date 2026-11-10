import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { loadThemePreference, saveThemePreference } from "@/shared/lib/theme-storage";
import { AppThemeContext } from "@/shared/providers/theme-context";
import type { ThemePreference } from "@/shared/types/theme.types";
import { resolveColorScheme } from "@/shared/utils/theme-resolver";

export interface AppThemeProviderProps {
  children: ReactNode;
}

/** Owns the manual dark-mode override and exposes the effective scheme. */
export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    void loadThemePreference()
      .then((stored) => {
        if (active) {
          setPreference(stored);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const setDarkMode = useCallback((enabled: boolean) => {
    const next: ThemePreference = enabled ? "dark" : "light";
    setPreference(next);
    void saveThemePreference(next).catch(() => undefined);
  }, []);

  const colorScheme = resolveColorScheme(systemScheme, preference);

  const value = useMemo(
    () => ({
      preference,
      colorScheme,
      isDark: colorScheme === "dark",
      ready,
      setDarkMode,
    }),
    [preference, colorScheme, ready, setDarkMode],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}
