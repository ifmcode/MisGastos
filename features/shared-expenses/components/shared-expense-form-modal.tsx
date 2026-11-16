import { PageSheetFormModal } from "@/shared/components/molecules/page-sheet-form-modal";
import type { Category } from "@/features/categories/types/category.types";
import type { Friend } from "@/features/friends/types/friend.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";

import type { SharedExpenseFieldErrors } from "../schemas/shared-expense.schema";
import type { SharedExpenseInput } from "../types/shared-expense.types";
import type { SharedExpenseFormValues } from "../utils/shared-expense-form";
import { SharedExpenseForm } from "./shared-expense-form";

export interface SharedExpenseFormModalProps {
  visible: boolean;
  friends: readonly Friend[];
  wallets: readonly Wallet[];
  categories: readonly Category[];
  initialValues: SharedExpenseFormValues;
  fieldErrors: SharedExpenseFieldErrors;
  error: string | null;
  submitting: boolean;
  isEditing: boolean;
  /** Create entry point that already knows the friend: the field stays locked. */
  friendLocked?: boolean;
  onSubmit: (input: SharedExpenseInput) => void;
  onCancel: () => void;
}

/** Page-sheet wrapper: the form state resets every time it is opened. */
export function SharedExpenseFormModal({
  visible,
  friends,
  wallets,
  categories,
  initialValues,
  fieldErrors,
  error,
  submitting,
  isEditing,
  friendLocked,
  onSubmit,
  onCancel,
}: SharedExpenseFormModalProps) {
  return (
    <PageSheetFormModal
      visible={visible}
      onRequestClose={onCancel}
      onDismiss={onCancel}
    >
      <SharedExpenseForm
        friends={friends}
        wallets={wallets}
        categories={categories}
        initialValues={initialValues}
        fieldErrors={fieldErrors}
        error={error}
        submitting={submitting}
        isEditing={isEditing}
        friendLocked={friendLocked}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </PageSheetFormModal>
  );
}
