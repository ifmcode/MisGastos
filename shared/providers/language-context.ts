import { createContext } from "react";

import type { AppLanguage } from "@/shared/types/language.types";

export interface AppLanguageContextValue {
  language: AppLanguage;
  languageTag: string;
  ready: boolean;
  setLanguage: (language: AppLanguage) => void;
}

export const AppLanguageContext =
  createContext<AppLanguageContextValue | null>(null);
