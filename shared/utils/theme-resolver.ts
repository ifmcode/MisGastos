import type { AppColorScheme, ThemePreference } from "@/shared/types/theme.types";

/** Resolves the effective scheme from the system value and the saved preference. */
export function resolveColorScheme(
  systemScheme: string | null | undefined,
  preference: ThemePreference,
): AppColorScheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }

  return systemScheme === "dark" ? "dark" : "light";
}
