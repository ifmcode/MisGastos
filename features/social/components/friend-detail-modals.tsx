import type { Friend } from "@/features/friends/types/friend.types";
import { SharedExpenseFormModal } from "@/features/shared-expenses/components/shared-expense-form-modal";
import type { SharedExpenseEditorController } from "@/features/shared-expenses/hooks/use-shared-expense-editor";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import type { UseConfirmDialogResult } from "@/shared/hooks/use-confirm-dialog";

export interface FriendDetailModalsProps {
  editor: SharedExpenseEditorController;
  friends: readonly Friend[];
  removeConfirm: UseConfirmDialogResult;
  deleteConfirm: UseConfirmDialogResult;
}

/** Create/edit sheet and the removal and deletion confirmations. */
export function FriendDetailModals({
  editor,
  friends,
  removeConfirm,
  deleteConfirm,
}: FriendDetailModalsProps) {
  return (
    <>
      <SharedExpenseFormModal
        visible={editor.formVisible}
        friends={friends}
        initialValues={editor.initialValues}
        fieldErrors={editor.fieldErrors}
        error={editor.formError}
        submitting={editor.submitting}
        isEditing={editor.editingExpense !== null}
        friendLocked={editor.friendLocked}
        onSubmit={editor.submit}
        onCancel={editor.closeForm}
      />

      <ConfirmDialog
        visible={removeConfirm.visible}
        title={removeConfirm.title}
        message={removeConfirm.message}
        confirmLabel={removeConfirm.confirmLabel}
        cancelLabel={removeConfirm.cancelLabel}
        onConfirm={removeConfirm.confirm}
        onCancel={removeConfirm.close}
      />

      <ConfirmDialog
        visible={deleteConfirm.visible}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmLabel={deleteConfirm.confirmLabel}
        cancelLabel={deleteConfirm.cancelLabel}
        onConfirm={deleteConfirm.confirm}
        onCancel={deleteConfirm.close}
      />
    </>
  );
}
