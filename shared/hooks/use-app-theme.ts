import { useContext } from "react";

import {
  AppThemeContext,
  type AppThemeContextValue,
} from "@/shared/providers/theme-context";

/** Reads the theme preference and the manual dark-mode setter. */
export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return context;
}
