import { WalletFormValues, WalletType } from "../types/wallet.types";

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

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  cash: "Efectivo",
  bank: "Banco",
  other: "Otra",
};

export const WALLET_TYPE_OPTIONS: ReadonlyArray<{
  value: WalletType;
  label: string;
  icon: WalletIcon;
}> = [
  { value: "cash", label: WALLET_TYPE_LABELS.cash, icon: "cash" },
  { value: "bank", label: WALLET_TYPE_LABELS.bank, icon: "business" },
  { value: "other", label: WALLET_TYPE_LABELS.other, icon: "wallet" },
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

export function getWalletTypeLabel(type: WalletType): string {
  return WALLET_TYPE_LABELS[type];
}
