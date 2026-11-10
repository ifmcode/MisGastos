import { useContext } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppThemeContext } from "@/shared/providers/theme-context";
import type { AppColorScheme } from "@/shared/types/theme.types";

/** Effective scheme: the manual override when present, otherwise the system. */
export function useAppColorScheme(): AppColorScheme {
  const context = useContext(AppThemeContext);
  const systemScheme = useColorScheme();

  if (context) {
    return context.colorScheme;
  }

  return systemScheme === "dark" ? "dark" : "light";
}
