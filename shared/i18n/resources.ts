import authEn from "@/features/auth/locales/en.json";
import authEs from "@/features/auth/locales/es.json";
import categoriesEn from "@/features/categories/locales/en.json";
import categoriesEs from "@/features/categories/locales/es.json";
import dashboardEn from "@/features/dashboard/locales/en.json";
import dashboardEs from "@/features/dashboard/locales/es.json";
import settingsEn from "@/features/settings/locales/en.json";
import settingsEs from "@/features/settings/locales/es.json";
import transactionsEn from "@/features/transactions/locales/en.json";
import transactionsEs from "@/features/transactions/locales/es.json";
import transfersEn from "@/features/transfers/locales/en.json";
import transfersEs from "@/features/transfers/locales/es.json";
import walletsEn from "@/features/wallets/locales/en.json";
import walletsEs from "@/features/wallets/locales/es.json";
import commonEn from "@/shared/i18n/locales/common/en.json";
import commonEs from "@/shared/i18n/locales/common/es.json";
import navigationEn from "@/shared/i18n/locales/navigation/en.json";
import navigationEs from "@/shared/i18n/locales/navigation/es.json";
import validationEn from "@/shared/i18n/locales/validation/en.json";
import validationEs from "@/shared/i18n/locales/validation/es.json";

export const NAMESPACES = [
  "common",
  "navigation",
  "validation",
  "auth",
  "wallets",
  "categories",
  "transactions",
  "transfers",
  "dashboard",
  "settings",
] as const;

export type AppNamespace = (typeof NAMESPACES)[number];

/** Every namespace is colocated with its feature, except the shared ones. */
export const resources = {
  es: {
    common: commonEs,
    navigation: navigationEs,
    validation: validationEs,
    auth: authEs,
    wallets: walletsEs,
    categories: categoriesEs,
    transactions: transactionsEs,
    transfers: transfersEs,
    dashboard: dashboardEs,
    settings: settingsEs,
  },
  en: {
    common: commonEn,
    navigation: navigationEn,
    validation: validationEn,
    auth: authEn,
    wallets: walletsEn,
    categories: categoriesEn,
    transactions: transactionsEn,
    transfers: transfersEn,
    dashboard: dashboardEn,
    settings: settingsEn,
  },
} as const;
