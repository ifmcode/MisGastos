import { Category } from "@/features/categories/types/category.types";
import { TransactionDetailModal } from "@/features/transactions/components/transaction-detail-modal";
import { TransactionsFormModal } from "@/features/transactions/components/transactions-form-modal";
import { Wallet } from "@/features/wallets/types/wallet.types";

import {
  DashboardMovementDialogs,
  DashboardMovementMutations,
} from "../hooks/use-dashboard-movement-dialogs";

export interface DashboardMovementModalsProps {
  dialogs: DashboardMovementDialogs;
  mutations: DashboardMovementMutations;
  /** Every wallet, including archived ones, for the detail labels. */
  wallets: readonly Wallet[];
  /** Active wallets only: the form never selects an archived wallet. */
  activeWallets: Wallet[];
  categories: readonly Category[];
  onCategoryCreated: (category: Category) => void;
}

/**
 * Read-only detail plus the existing edit form, composed exactly like the
 * movements screen so both entries share one edit/delete flow.
 */
export function DashboardMovementModals({
  dialogs,
  mutations,
  wallets,
  activeWallets,
  categories,
  onCategoryCreated,
}: DashboardMovementModalsProps) {
  const { detail, form } = dialogs;

  return (
    <>
      <TransactionDetailModal
        visible={detail.visible}
        transaction={detail.transaction}
        wallets={wallets}
        categories={categories}
        mutating={mutations.mutating}
        error={mutations.mutationError}
        onEdit={dialogs.editFromDetail}
        onDelete={dialogs.deleteTransaction}
        onClose={detail.close}
      />

      <TransactionsFormModal
        visible={form.visible}
        mutating={mutations.mutating}
        error={mutations.mutationError}
        fieldErrors={mutations.mutationFieldErrors}
        wallets={activeWallets}
        walletLookup={wallets}
        categories={categories}
        editingTransaction={form.editingTransaction}
        onSubmit={(input) => void form.submit(input)}
        onDelete={form.deleteEditing}
        onClose={form.close}
        onCategoryCreated={onCategoryCreated}
      />
    </>
  );
}
