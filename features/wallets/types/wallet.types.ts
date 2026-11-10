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
