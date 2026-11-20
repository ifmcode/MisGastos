import { CreateWalletDto } from "../types/wallet.types";
import { createWalletFormValues } from "./wallet-options";

const DEFAULT_WALLET_ID_PREFIX = "main-wallet";

/**
 * Deterministic id derived only from the owner, so two devices seeding at the
 * same time converge on one document instead of creating two wallets. A
 * Firestore document id cannot contain `/`, so it is replaced.
 */
export function buildDefaultWalletId(ownerId: string): string {
  return `${DEFAULT_WALLET_ID_PREFIX}_${ownerId.trim().replace(/\//g, "_")}`;
}

/**
 * Builds the seeded wallet from the shared create defaults: icon, colour, type
 * and `includeInTotal` are not invented here, and the currency falls back to
 * EUR through `createWalletFormValues`. The initial balance is always 0.
 */
export function buildDefaultWalletDto(
  name: string,
  preferredCurrency: unknown,
): CreateWalletDto {
  const defaults = createWalletFormValues(preferredCurrency);

  return {
    name: name.trim(),
    currency: defaults.currency,
    icon: defaults.icon,
    color: defaults.color,
    initialBalance: 0,
    type: defaults.type,
    includeInTotal: defaults.includeInTotal,
  };
}
