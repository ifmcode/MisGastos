import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { DELETED_WALLET_NAME_PREFIX } from "@/features/wallets/utils/deleted-wallet";
import { formatMoney } from "@/features/wallets/utils/money";
import { isWalletArchived } from "@/features/wallets/utils/wallet-status";
import { formatDateInput } from "@/shared/utils/date";

import { Transaction } from "../types/transaction.types";
import {
  getTransactionCategory,
  getTransactionTypeLabel,
} from "./transaction-options";

export interface TransactionDetailSummary {
  typeLabel: string;
  amountLabel: string;
  currency: string;
  isIncome: boolean;
}

export type TransactionDetailFieldKey =
  | "wallet"
  | "category"
  | "concept"
  | "date"
  | "notes";

export interface TransactionDetailField {
  key: TransactionDetailFieldKey;
  label: string;
  value: string;
}

export type TransactionWalletStatus = "active" | "archived" | "deleted";

export interface TransactionWalletInfo {
  name: string;
  status: TransactionWalletStatus;
}

export function getTransactionDetailSummary(
  transaction: Transaction,
): TransactionDetailSummary {
  return {
    typeLabel: getTransactionTypeLabel(transaction.type),
    amountLabel: formatMoney(transaction.amount, transaction.currency),
    currency: transaction.currency,
    isIncome: transaction.type === "income",
  };
}

/**
 * Resolves the wallet from the live list first so archived wallets keep their
 * current name, then falls back to the stored name for deleted wallets.
 */
export function getTransactionWalletInfo(
  transaction: Transaction,
  wallets: readonly Wallet[],
): TransactionWalletInfo {
  const wallet = wallets.find((item) => item.id === transaction.walletId);

  if (wallet) {
    return {
      name: wallet.name,
      status: isWalletArchived(wallet) ? "archived" : "active",
    };
  }

  return {
    name: transaction.walletName?.trim() || "Cartera no disponible",
    status: "deleted",
  };
}

export function getTransactionWalletLabel(
  wallet: TransactionWalletInfo,
): string {
  if (wallet.status === "archived") {
    return `${wallet.name} (archivada)`;
  }

  if (
    wallet.status === "deleted" &&
    !wallet.name.startsWith(DELETED_WALLET_NAME_PREFIX)
  ) {
    return `${wallet.name} (eliminada)`;
  }

  return wallet.name;
}

export function buildTransactionDetailFields(
  transaction: Transaction,
  wallets: readonly Wallet[],
  categories: readonly Category[],
): TransactionDetailField[] {
  const category = getTransactionCategory(categories, transaction.categoryId);

  return [
    {
      key: "wallet",
      label: "Cartera",
      value: getTransactionWalletLabel(
        getTransactionWalletInfo(transaction, wallets),
      ),
    },
    { key: "category", label: "Categoría", value: category.label },
    { key: "concept", label: "Concepto", value: transaction.concept },
    { key: "date", label: "Fecha", value: formatDateInput(transaction.date) },
    {
      key: "notes",
      label: "Notas",
      value: transaction.notes?.trim() || "Sin notas",
    },
  ];
}
