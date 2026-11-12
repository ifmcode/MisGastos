import { useContext } from "react";

import { AppLanguageContext } from "@/shared/providers/language-context";
import type { AppLanguageContextValue } from "@/shared/providers/language-context";

export function useAppLanguage(): AppLanguageContextValue {
  const context = useContext(AppLanguageContext);

  if (!context) {
    throw new Error("useAppLanguage must be used inside AppLanguageProvider");
  }

  return context;
}
