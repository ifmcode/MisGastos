import { useColorScheme } from "@/hooks/use-color-scheme";

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
}

/**
 * Shared colors for the modal forms (wallets, transactions, transfers) so each
 * screen does not redefine the light/dark palette.
 */
export function useFormTheme(): FormTheme {
  const isDark = (useColorScheme() ?? "light") === "dark";

  return {
    isDark,
    background: isDark ? "#151718" : "#F7FAFB",
    surface: isDark ? "#1C2225" : "#FFFFFF",
    border: isDark ? "#2B3438" : "#DCE6E9",
    text: isDark ? "#ECEDEE" : "#11181C",
    muted: isDark ? "#9BA1A6" : "#5C6B70",
    primary: "#0A7EA4",
    primarySoft: "rgba(10, 126, 164, 0.12)",
    onPrimary: "#FFFFFF",
    danger: "#C62828",
    dangerSurface: "#FDECEA",
    dangerText: "#8A1C1C",
  };
}
