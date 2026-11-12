export const SUPPORTED_LANGUAGES = ["es", "en"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "es";

export const FALLBACK_LANGUAGE: AppLanguage = "es";

/** Full tags used by `Intl` when the device does not provide a matching one. */
export const INTL_LOCALES: Record<AppLanguage, string> = {
  es: "es-ES",
  en: "en-US",
};

export function isAppLanguage(value: unknown): value is AppLanguage {
  return (
    typeof value === "string" &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  );
}
