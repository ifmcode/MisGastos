import { CurrencyCode } from "@/shared/constants/currencies";
import { BaseEntity } from "@/shared/types/common.types";

export interface Transfer extends BaseEntity {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: CurrencyCode;
  /** Calendar date stored as YYYY-MM-DD to avoid timezone shifts. */
  date: string;
  notes?: string;
  ownerId: string;
  /** Soft-delete marker. Deleted transfers are kept for audit purposes. */
  deletedAt?: string;
}

export interface CreateTransferDto {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  notes?: string;
}

export type UpdateTransferDto = CreateTransferDto;

/**
 * Raw values handled by the transfer form. `amount` is a string because users
 * type decimals (and may use a comma as decimal separator).
 */
export interface TransferFormValues {
  fromWalletId: string;
  toWalletId: string;
  amount: string;
  currency: CurrencyCode;
  date: string;
  notes: string;
}
