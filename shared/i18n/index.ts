import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { parseMissingKey } from "@/shared/i18n/missing-key";
import { NAMESPACES, resources } from "@/shared/i18n/resources";
import { FALLBACK_LANGUAGE } from "@/shared/types/language.types";
import { resolveAppLanguage } from "@/shared/utils/language";

export function getDeviceLanguageTags(): string[] {
  return getLocales().map((locale) => locale.languageTag);
}

const initialLanguage = resolveAppLanguage(null, getDeviceLanguageTags());

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: FALLBACK_LANGUAGE,
  defaultNS: "common",
  ns: NAMESPACES,
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
  saveMissing: typeof __DEV__ !== "undefined" && __DEV__,
  missingKeyHandler: (languages, namespace, key) => {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn(
        `[i18n] Missing key "${key}" in namespace "${namespace}" for ${languages.join(", ")}`,
      );
    }
  },
  parseMissingKeyHandler: parseMissingKey,
});

export { i18n };
