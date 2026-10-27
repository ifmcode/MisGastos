import { CurrencyCode } from "@/shared/constants/currencies";
import { BaseEntity } from "@/shared/types/common.types";

export type TransactionType = "expense" | "income" | "transfer";

export interface Transaction extends BaseEntity {
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  walletId: string;
  categoryId?: string;
  concept: string;
  notes?: string;
  date: string | Date;
  ownerId: string;
  // For transfers
  fromWalletId?: string;
  toWalletId?: string;
  transferId?: string;
}

export interface CreateTransactionDto {
  type: Exclude<TransactionType, "transfer">;
  amount: number;
  currency: CurrencyCode;
  walletId: string;
  categoryId?: string;
  concept: string;
  notes?: string;
  date: string | Date;
}

export interface UpdateTransactionDto {
  amount?: number;
  currency?: CurrencyCode;
  categoryId?: string;
  concept?: string;
  notes?: string;
  date?: string | Date;
}

export interface CreateTransferDto {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: CurrencyCode;
  notes?: string;
  date: string | Date;
}
