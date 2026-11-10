import { createContext } from "react";

import type {
  AppColorScheme,
  ThemePreference,
} from "@/shared/types/theme.types";

export interface AppThemeContextValue {
  preference: ThemePreference;
  colorScheme: AppColorScheme;
  isDark: boolean;
  ready: boolean;
  setDarkMode: (enabled: boolean) => void;
}

export const AppThemeContext = createContext<AppThemeContextValue | null>(null);
