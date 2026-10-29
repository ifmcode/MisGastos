import { CurrencyCode } from "@/shared/constants/currencies";
import { BaseEntity } from "@/shared/types/common.types";

export type TransactionType = "expense" | "income";

export interface Transaction extends BaseEntity {
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  walletId: string;
  categoryId: string;
  concept: string;
  notes?: string;
  /** Calendar date stored as YYYY-MM-DD to avoid timezone shifts. */
  date: string;
  ownerId: string;
}

export interface CreateTransactionDto {
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  walletId: string;
  categoryId: string;
  concept: string;
  notes?: string;
  date: string;
}

export type UpdateTransactionDto = CreateTransactionDto;

/**
 * Raw values handled by the transaction form. `amount` is a string because
 * users type decimals (and may use a comma as decimal separator).
 */
export interface TransactionFormValues {
  type: TransactionType;
  amount: string;
  walletId: string;
  currency: CurrencyCode;
  categoryId: string;
  concept: string;
  notes: string;
  date: string;
}
