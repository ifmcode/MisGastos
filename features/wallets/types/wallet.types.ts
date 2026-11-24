import { CurrencyCode } from "@/shared/constants/currencies";
import { BaseEntity } from "@/shared/types/common.types";

export type WalletType = "cash" | "bank" | "other";

export interface Wallet extends BaseEntity {
  name: string;
  currency: CurrencyCode;
  icon: string;
  color: string;
  initialBalance: number;
  balance: number;
  type: WalletType;
  includeInTotal: boolean;
  ownerId: string;
  /** Optimistic-concurrency counter: creates write 0, updates add one. */
  revision: number;
  description?: string;
  /** Soft-delete marker. Archived wallets keep their history but leave selectors. */
  archivedAt?: string;
}

export interface CreateWalletDto {
  name: string;
  currency: CurrencyCode;
  icon: string;
  color: string;
  initialBalance: number;
  type: WalletType;
  includeInTotal: boolean;
  description?: string;
  /** Client-generated id so an offline create can be referenced before sync. */
  id?: string;
}

/**
 * Currency is intentionally absent: changing it would break every movement
 * already stored with the wallet's original currency.
 */
export interface UpdateWalletDto {
  name?: string;
  icon?: string;
  color?: string;
  type?: WalletType;
  includeInTotal?: boolean;
  description?: string;
  /** Only sent when the wallet has no movements and the user edits it. */
  initialBalance?: number;
}

/**
 * Raw values handled by the wallet form. `initialBalance` is a string because
 * users type decimals (and may use a comma as decimal separator).
 */
export interface WalletFormValues {
  name: string;
  currency: CurrencyCode;
  icon: string;
  color: string;
  initialBalance: string;
  type: WalletType;
  includeInTotal: boolean;
  description: string;
}

/**
 * Input of the first-load seed. The wallet name is resolved from the `wallets`
 * namespace by the caller because wallet names are stored, never re-translated.
 * `preferredCurrency` is only a fallback: the stored profile value wins.
 */
export interface SeedDefaultWalletInput {
  name: string;
  preferredCurrency?: unknown;
}

export type DefaultWalletSeedResult =
  | { status: "seeded"; wallet: Wallet }
  | { status: "already-seeded" }
  | { status: "skipped-existing-wallets" };

export interface WalletUsage {
  transactionCount: number;
  transferCount: number;
  hasMovements: boolean;
}

export type WalletDeleteMode = "keep" | "reassign";

export interface DeleteWalletOptions {
  mode: WalletDeleteMode;
  targetWalletId?: string;
}

export interface WalletDeletionResult {
  deletedWalletId: string;
  /** Target wallet whose balance changed after reassigning movements. */
  targetWallet?: Wallet;
}
