import { CurrencyCode } from "@/shared/constants/currencies";
import { BaseEntity } from "@/shared/types/common.types";

export type TransactionType = "expense" | "income";

export interface Transaction extends BaseEntity {
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  walletId: string;
  /** Display name kept when the wallet was permanently deleted. */
  walletName?: string;
  categoryId: string;
  concept: string;
  notes?: string;
  /** Calendar date stored as YYYY-MM-DD to avoid timezone shifts. */
  date: string;
  ownerId: string;
  /** Linked `sharedExpenses` record. Only expense movements can carry one. */
  sharedExpenseId?: string;
  /** Soft-delete marker; linked movements are never hard-deleted. */
  deletedAt: string | null;
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
  /** Ignored unless `type` is `expense`; the mapper drops it otherwise. */
  sharedExpenseId?: string;
  /** Optional soft-delete stamp; new movements default to `null`. */
  deletedAt?: string | null;
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
