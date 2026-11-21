import { Category } from "@/features/categories/types/category.types";
import type { Friend } from "@/features/friends/types/friend.types";
import { GroupExpenseFormModal } from "@/features/group-expenses/components/group-expense-form-modal";
import type { GroupExpenseEditorController } from "@/features/group-expenses/hooks/use-group-expense-editor";
import { SharedExpenseEditorModal } from "@/features/shared-expenses/components/shared-expense-editor-modal";
import type { SharedExpenseEditorController } from "@/features/shared-expenses/hooks/use-shared-expense-editor";
import { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";

import type { TransactionDetailDialog } from "../hooks/use-transaction-detail-dialog";
import type { TransactionFormDialog } from "../hooks/use-transaction-form-dialog";
import type { TransactionValidationErrors } from "../schemas/transaction.schema";
import type { Transaction } from "../types/transaction.types";
import type { TransactionFilters } from "../utils/transaction-filters";
import { TransactionDetailModal } from "./transaction-detail-modal";
import { TransactionsFiltersDialog } from "./transactions-filters-dialog";
import { TransactionsFormModal } from "./transactions-form-modal";

export interface TransactionsModalsProps {
  wallets: readonly Wallet[];
  activeWallets: Wallet[];
  categories: readonly Category[];
  preferredCurrency: CurrencyCode;
  mutating: boolean;
  mutationError: string | null;
  mutationFieldErrors: TransactionValidationErrors;
  detail: TransactionDetailDialog;
  form: TransactionFormDialog;
  filtersVisible: boolean;
  filters: TransactionFilters;
  onEditFromDetail: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => Promise<boolean>;
  onApplyFilters: (filters: TransactionFilters) => void;
  onResetFilters: () => void;
  onCloseFilters: () => void;
  onCategoryCreated: (category: Category) => void;
  sharedExpenseEditor: SharedExpenseEditorController;
  groupExpenseEditor: GroupExpenseEditorController;
  friends: readonly Friend[];
}

/** Detail, form and filter dialogs of the movements screen. */
export function TransactionsModals({
  wallets,
  activeWallets,
  categories,
  preferredCurrency,
  mutating,
  mutationError,
  mutationFieldErrors,
  detail,
  form,
  filtersVisible,
  filters,
  onEditFromDetail,
  onDelete,
  onApplyFilters,
  onResetFilters,
  onCloseFilters,
  onCategoryCreated,
  sharedExpenseEditor,
  groupExpenseEditor,
  friends,
}: TransactionsModalsProps) {
  return (
    <>
      <TransactionDetailModal
        visible={detail.visible}
        transaction={detail.transaction}
        wallets={wallets}
        categories={categories}
        mutating={mutating}
        error={mutationError}
        onEdit={onEditFromDetail}
        onDelete={onDelete}
        onClose={detail.close}
      />

      <TransactionsFormModal
        visible={form.visible}
        mutating={mutating}
        error={mutationError}
        fieldErrors={mutationFieldErrors}
        wallets={activeWallets}
        walletLookup={wallets}
        categories={categories}
        editingTransaction={form.editingTransaction}
        preferredCurrency={preferredCurrency}
        onSubmit={(input) => void form.submit(input)}
        onDelete={form.deleteEditing}
        onClose={form.close}
        onCategoryCreated={onCategoryCreated}
      />

      <SharedExpenseEditorModal
        editor={sharedExpenseEditor}
        friends={friends}
      />

      <GroupExpenseFormModal editor={groupExpenseEditor} />

      <TransactionsFiltersDialog
        visible={filtersVisible}
        wallets={activeWallets}
        categories={categories}
        filters={filters}
        onApply={onApplyFilters}
        onReset={onResetFilters}
        onClose={onCloseFilters}
      />
    </>
  );
}
