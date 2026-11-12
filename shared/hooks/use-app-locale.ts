import { useMemo } from "react";

import type { CurrencyCode } from "@/shared/constants/currencies";
import { useAppLanguage } from "@/shared/hooks/use-app-language";
import type { AppLanguage } from "@/shared/types/language.types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
} from "@/shared/utils/format";

export interface AppLocale {
  language: AppLanguage;
  locale: string;
  formatCurrency: (value: number, currency: CurrencyCode) => string;
  formatDate: (isoDate: string, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (
    value: Date | string,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatNumber: (
    value: number,
    options?: Intl.NumberFormatOptions,
  ) => string;
  formatPercent: (
    value: number,
    options?: Intl.NumberFormatOptions,
  ) => string;
}

/** Locale-aware formatters backed by `Intl` and the active language tag. */
export function useAppLocale(): AppLocale {
  const { language, languageTag } = useAppLanguage();

  return useMemo(
    () => ({
      language,
      locale: languageTag,
      formatCurrency: (value, currency) =>
        formatCurrency(value, currency, languageTag),
      formatDate: (isoDate, options) =>
        formatDate(isoDate, languageTag, options),
      formatDateTime: (value, options) =>
        formatDateTime(value, languageTag, options),
      formatNumber: (value, options) =>
        formatNumber(value, languageTag, options),
      formatPercent: (value, options) =>
        formatPercent(value, languageTag, options),
    }),
    [language, languageTag],
  );
}
