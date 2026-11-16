import type { Friend } from "@/features/friends/types/friend.types";

import type { SharedExpenseEditorController } from "../hooks/use-shared-expense-editor";
import { SharedExpenseFormModal } from "./shared-expense-form-modal";

export interface SharedExpenseEditorModalProps {
  editor: SharedExpenseEditorController;
  friends: readonly Friend[];
}

/**
 * Create/edit page sheet of a shared expense. The friend detail and the detail
 * route share it, so both entry points keep one form contract.
 */
export function SharedExpenseEditorModal({
  editor,
  friends,
}: SharedExpenseEditorModalProps) {
  return (
    <SharedExpenseFormModal
      visible={editor.formVisible}
      friends={friends}
      wallets={editor.wallets}
      categories={editor.categories}
      initialValues={editor.initialValues}
      fieldErrors={editor.fieldErrors}
      error={editor.formError}
      submitting={editor.submitting}
      isEditing={editor.editingExpense !== null}
      friendLocked={editor.friendLocked}
      onSubmit={editor.submit}
      onCancel={editor.closeForm}
    />
  );
}
