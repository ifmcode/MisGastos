import { getThemeTokens } from "@/shared/constants/theme-tokens";
import { useAppColorScheme } from "@/shared/hooks/use-app-color-scheme";

export interface FormTheme {
  isDark: boolean;
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  danger: string;
  dangerSurface: string;
  dangerText: string;
  success: string;
}

/**
 * Shared colors for the modal forms (wallets, transactions, transfers) so each
 * screen does not redefine the light/dark palette.
 */
export function useFormTheme(): FormTheme {
  const colorScheme = useAppColorScheme();
  const tokens = getThemeTokens(colorScheme);

  return {
    isDark: colorScheme === "dark",
    background: tokens.backgroundMuted,
    surface: tokens.surface,
    border: tokens.border,
    text: tokens.text,
    muted: tokens.muted,
    primary: tokens.primary,
    primarySoft: tokens.primarySoft,
    onPrimary: tokens.onPrimary,
    danger: tokens.danger,
    dangerSurface: tokens.dangerSurface,
    dangerText: tokens.dangerText,
    success: tokens.success,
  };
}
