import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ThemePreference } from "@/shared/types/theme.types";

export const THEME_PREFERENCE_KEY = "misgastos.theme.preference";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

/** Reads the saved preference. Invalid or missing values fall back to `system`. */
export async function loadThemePreference(): Promise<ThemePreference> {
  const stored = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
  return isThemePreference(stored) ? stored : "system";
}

export async function saveThemePreference(
  preference: ThemePreference,
): Promise<void> {
  await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
}
