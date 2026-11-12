import AsyncStorage from "@react-native-async-storage/async-storage";

import { isAppLanguage, type AppLanguage } from "@/shared/types/language.types";

export const LANGUAGE_PREFERENCE_KEY = "misgastos.language.preference";

/** Reads the explicit user choice. Missing or invalid values return null. */
export async function loadLanguagePreference(): Promise<AppLanguage | null> {
  const stored = await AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY);
  return isAppLanguage(stored) ? stored : null;
}

export async function saveLanguagePreference(
  language: AppLanguage,
): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, language);
}
