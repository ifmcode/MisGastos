import type { Friend } from "@/features/friends/types/friend.types";
import { SharedExpenseEditorModal } from "@/features/shared-expenses/components/shared-expense-editor-modal";
import type { SharedExpenseEditorController } from "@/features/shared-expenses/hooks/use-shared-expense-editor";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import type { UseConfirmDialogResult } from "@/shared/hooks/use-confirm-dialog";

export interface FriendDetailModalsProps {
  editor: SharedExpenseEditorController;
  friends: readonly Friend[];
  removeConfirm: UseConfirmDialogResult;
}

/** Create/edit sheet and the remove-friend confirmation. */
export function FriendDetailModals({
  editor,
  friends,
  removeConfirm,
}: FriendDetailModalsProps) {
  return (
    <>
      <SharedExpenseEditorModal editor={editor} friends={friends} />

      <ConfirmDialog
        visible={removeConfirm.visible}
        title={removeConfirm.title}
        message={removeConfirm.message}
        confirmLabel={removeConfirm.confirmLabel}
        cancelLabel={removeConfirm.cancelLabel}
        onConfirm={removeConfirm.confirm}
        onCancel={removeConfirm.close}
      />
    </>
  );
}
