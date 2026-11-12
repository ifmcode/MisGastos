import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  INTL_LOCALES,
  isAppLanguage,
  SUPPORTED_LANGUAGES,
} from "@/shared/types/language.types";

/** Reduces `es-ES`, `es_ES` or `ES` to the base language code. */
export function normalizeLanguageCode(value: string): string {
  return value.trim().toLowerCase().split(/[-_]/)[0] ?? "";
}

/**
 * Resolution order: a valid saved preference, then the first supported device
 * locale, then Spanish. Unsupported device locales never leak into the app.
 */
export function resolveAppLanguage(
  stored: unknown,
  deviceLocales: readonly string[],
  supported: readonly AppLanguage[] = SUPPORTED_LANGUAGES,
): AppLanguage {
  if (isAppLanguage(stored) && supported.includes(stored)) {
    return stored;
  }

  for (const tag of deviceLocales) {
    const language = normalizeLanguageCode(tag);
    if (isAppLanguage(language) && supported.includes(language)) {
      return language;
    }
  }

  return DEFAULT_LANGUAGE;
}

/** Keeps the device region for `Intl` when it matches the chosen language. */
export function resolveLanguageTag(
  language: AppLanguage,
  deviceLocales: readonly string[],
): string {
  const match = deviceLocales.find(
    (tag) => normalizeLanguageCode(tag) === language,
  );

  return match ?? INTL_LOCALES[language];
}
