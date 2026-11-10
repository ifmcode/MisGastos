/** User preference. `system` follows the OS until the user overrides it. */
export type ThemePreference = "system" | "light" | "dark";

/** Effective scheme used by the UI after resolving the preference. */
export type AppColorScheme = "light" | "dark";

export interface ThemeTokens {
  background: string;
  backgroundMuted: string;
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
  overlay: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
}
