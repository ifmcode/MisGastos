import { useTranslation } from "react-i18next";

import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";

import { Transaction } from "../types/transaction.types";
import { TransactionsList } from "./transactions-list";

export interface TransactionsBodyProps {
  transactions: readonly Transaction[];
  walletMap: ReadonlyMap<string, Wallet>;
  categories: readonly Category[];
  hasFilters: boolean;
  activeFilterCount: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenDetail: (transaction: Transaction) => void;
  onCreate: () => void;
  onClearFilters: () => void;
}

/** Loading, error and list states of the movements screen. */
export function TransactionsBody({
  transactions,
  walletMap,
  categories,
  hasFilters,
  activeFilterCount,
  loading,
  error,
  onRetry,
  onOpenDetail,
  onCreate,
  onClearFilters,
}: TransactionsBodyProps) {
  const { t } = useTranslation(["transactions", "common"]);

  if (loading) return <LoadingState message={t("loading")} />;

  if (error) {
    return (
      <ErrorState
        title={t("errorTitle")}
        message={error}
        retryLabel={t("common:actions.retry")}
        retryAccessibilityLabel={t("retryAccessibility")}
        onRetry={onRetry}
      />
    );
  }

  return (
    <TransactionsList
      transactions={transactions}
      walletMap={walletMap}
      categories={categories}
      hasFilters={hasFilters}
      activeFilterCount={activeFilterCount}
      onOpenDetail={onOpenDetail}
      onCreate={onCreate}
      onClearFilters={onClearFilters}
    />
  );
}
