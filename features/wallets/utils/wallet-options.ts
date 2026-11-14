import { resolveCurrencyCode } from "@/shared/constants/currencies";

import { Wallet, WalletFormValues, WalletType } from "../types/wallet.types";

/**
 * Predefined icon names from Ionicons. Keeping the set closed avoids
 * rendering invalid icons and keeps the MVP free of custom images.
 */
export const WALLET_ICONS = [
  "wallet",
  "cash",
  "card",
  "business",
  "home",
  "car",
  "airplane",
  "gift",
  "star",
  "globe",
  "phone-portrait",
  "trending-up",
] as const;

export type WalletIcon = (typeof WALLET_ICONS)[number];

export const WALLET_COLORS = [
  "#0A7EA4",
  "#2E7D32",
  "#C62828",
  "#6A1B9A",
  "#EF6C00",
  "#00838F",
  "#4E342E",
  "#455A64",
] as const;

export type WalletColor = (typeof WALLET_COLORS)[number];

export const WALLET_TYPE_KEYS: Record<WalletType, string> = {
  cash: "types.cash",
  bank: "types.bank",
  other: "types.other",
};

export const WALLET_TYPE_OPTIONS: ReadonlyArray<{
  value: WalletType;
  labelKey: string;
  icon: WalletIcon;
}> = [
  { value: "cash", labelKey: WALLET_TYPE_KEYS.cash, icon: "cash" },
  { value: "bank", labelKey: WALLET_TYPE_KEYS.bank, icon: "business" },
  { value: "other", labelKey: WALLET_TYPE_KEYS.other, icon: "wallet" },
];

export const DEFAULT_WALLET_FORM_VALUES: WalletFormValues = {
  name: "",
  currency: "EUR",
  icon: "wallet",
  color: WALLET_COLORS[0],
  initialBalance: "",
  type: "cash",
  includeInTotal: true,
  description: "",
};

/**
 * Builds the create form defaults, preselecting the user's preferred currency
 * and falling back to the project default when it is missing or invalid.
 */
export function createWalletFormValues(
  preferredCurrency?: unknown,
): WalletFormValues {
  return {
    ...DEFAULT_WALLET_FORM_VALUES,
    currency: resolveCurrencyCode(preferredCurrency),
  };
}

/** Converts a stored wallet into the raw values handled by the edit form. */
export function buildWalletFormValues(wallet: Wallet): WalletFormValues {
  return {
    name: wallet.name,
    currency: wallet.currency,
    icon: wallet.icon,
    color: wallet.color,
    initialBalance: wallet.initialBalance.toFixed(2).replace(".", ","),
    type: wallet.type,
    includeInTotal: wallet.includeInTotal,
    description: wallet.description ?? "",
  };
}

export function isWalletIcon(value: unknown): value is WalletIcon {
  return (
    typeof value === "string" &&
    (WALLET_ICONS as readonly string[]).includes(value)
  );
}

export function isWalletType(value: unknown): value is WalletType {
  return value === "cash" || value === "bank" || value === "other";
}

export function getWalletIconName(value: string): WalletIcon {
  return isWalletIcon(value) ? value : "wallet";
}

export function getWalletTypeKey(type: WalletType): string {
  return WALLET_TYPE_KEYS[type];
}
