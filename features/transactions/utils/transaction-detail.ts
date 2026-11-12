import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { DELETED_WALLET_NAME_PREFIX } from "@/features/wallets/utils/deleted-wallet";
import { isWalletArchived } from "@/features/wallets/utils/wallet-status";
import type { CurrencyCode } from "@/shared/constants/currencies";

import { Transaction } from "../types/transaction.types";
import {
  getTransactionCategory,
  getTransactionCategoryLabel,
} from "./transaction-options";

export interface TransactionDetailSummary {
  typeKey: string;
  amountLabel: string;
  currency: CurrencyCode;
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
  labelKey: string;
  value: string;
}

export type TransactionWalletStatus = "active" | "archived" | "deleted";

export interface TransactionWalletInfo {
  name: string;
  status: TransactionWalletStatus;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function getTransactionDetailSummary(
  transaction: Transaction,
  formatCurrency: (value: number, currency: CurrencyCode) => string,
): TransactionDetailSummary {
  return {
    typeKey:
      transaction.type === "income" ? "types.income" : "types.expense",
    amountLabel: formatCurrency(transaction.amount, transaction.currency),
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
    name: transaction.walletName?.trim() || "",
    status: "deleted",
  };
}

export function getTransactionWalletLabel(
  wallet: TransactionWalletInfo,
  t: Translate,
): string {
  const name = wallet.name || t("detail.unavailableWallet");

  if (wallet.status === "archived") {
    return `${name} ${t("detail.archivedSuffix")}`;
  }

  if (
    wallet.status === "deleted" &&
    !name.startsWith(DELETED_WALLET_NAME_PREFIX)
  ) {
    return `${name} ${t("detail.deletedSuffix")}`;
  }

  return name;
}

export function buildTransactionDetailFields(
  transaction: Transaction,
  wallets: readonly Wallet[],
  categories: readonly Category[],
  t: Translate,
  formatDate: (isoDate: string) => string,
): TransactionDetailField[] {
  const category = getTransactionCategory(categories, transaction.categoryId);

  return [
    {
      key: "wallet",
      labelKey: "detail.wallet",
      value: getTransactionWalletLabel(
        getTransactionWalletInfo(transaction, wallets),
        t,
      ),
    },
    {
      key: "category",
      labelKey: "detail.category",
      value: getTransactionCategoryLabel(category, t),
    },
    {
      key: "concept",
      labelKey: "detail.concept",
      value: transaction.concept,
    },
    {
      key: "date",
      labelKey: "detail.date",
      value: formatDate(transaction.date),
    },
    {
      key: "notes",
      labelKey: "detail.notes",
      value: transaction.notes?.trim() || t("common:states.noNotes"),
    },
  ];
}
