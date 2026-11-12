import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { getDeviceLanguageTags, i18n } from "@/shared/i18n";
import {
  loadLanguagePreference,
  saveLanguagePreference,
} from "@/shared/lib/language-storage";
import { AppLanguageContext } from "@/shared/providers/language-context";
import type { AppLanguage } from "@/shared/types/language.types";
import {
  resolveAppLanguage,
  resolveLanguageTag,
} from "@/shared/utils/language";

export interface AppLanguageProviderProps {
  children: ReactNode;
}

/** Loads the saved language before rendering and keeps i18next in sync. */
export function AppLanguageProvider({ children }: AppLanguageProviderProps) {
  const deviceLocales = useMemo(() => getDeviceLanguageTags(), []);
  const [language, setLanguageState] = useState<AppLanguage>(() =>
    resolveAppLanguage(null, deviceLocales),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    void loadLanguagePreference()
      .then((stored) => {
        if (!active) return;
        const resolved = resolveAppLanguage(stored, deviceLocales);
        setLanguageState(resolved);
        void i18n.changeLanguage(resolved);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [deviceLocales]);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    void i18n.changeLanguage(next);
    void saveLanguagePreference(next).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      language,
      languageTag: resolveLanguageTag(language, deviceLocales),
      ready,
      setLanguage,
    }),
    [deviceLocales, language, ready, setLanguage],
  );

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AppLanguageContext.Provider value={value}>
      {children}
    </AppLanguageContext.Provider>
  );
}
