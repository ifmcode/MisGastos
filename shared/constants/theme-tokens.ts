import type { AppColorScheme, ThemeTokens } from "@/shared/types/theme.types";

const sharedTokens = {
  primary: "#0A7EA4",
  primarySoft: "rgba(10, 126, 164, 0.12)",
  onPrimary: "#FFFFFF",
} as const;

export const lightThemeTokens: ThemeTokens = {
  ...sharedTokens,
  background: "#FFFFFF",
  backgroundMuted: "#F7FAFB",
  surface: "#FFFFFF",
  border: "#DCE6E9",
  text: "#11181C",
  muted: "#5C6B70",
  danger: "#C62828",
  dangerSurface: "#FDECEA",
  dangerText: "#8A1C1C",
  success: "#2E7D32",
  overlay: "rgba(17, 24, 28, 0.5)",
  tint: "#0A7EA4",
  icon: "#687076",
  tabIconDefault: "#687076",
  tabIconSelected: "#0A7EA4",
};

export const darkThemeTokens: ThemeTokens = {
  ...sharedTokens,
  background: "#151718",
  backgroundMuted: "#151718",
  surface: "#1C2225",
  border: "#2B3438",
  text: "#ECEDEE",
  muted: "#9BA1A6",
  danger: "#EF5350",
  dangerSurface: "rgba(198, 40, 40, 0.18)",
  dangerText: "#FFB4B4",
  success: "#66BB6A",
  overlay: "rgba(0, 0, 0, 0.6)",
  tint: "#FFFFFF",
  icon: "#9BA1A6",
  tabIconDefault: "#9BA1A6",
  tabIconSelected: "#FFFFFF",
};

export function getThemeTokens(scheme: AppColorScheme): ThemeTokens {
  return scheme === "dark" ? darkThemeTokens : lightThemeTokens;
}
