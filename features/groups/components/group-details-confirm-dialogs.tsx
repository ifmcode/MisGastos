import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import type { UseConfirmDialogResult } from "@/shared/hooks/use-confirm-dialog";

export interface GroupDetailsConfirmDialogsProps {
  removeConfirm: UseConfirmDialogResult;
  cancelConfirm: UseConfirmDialogResult;
  leaveConfirm: UseConfirmDialogResult;
  transferConfirm: UseConfirmDialogResult;
  blockedDialog: UseConfirmDialogResult;
}

/**
 * Confirmations of the details sheet: remove, cancel invitation, leave, transfer
 * and the blocked-balance dialog whose confirm opens the settle route.
 */
export function GroupDetailsConfirmDialogs({
  removeConfirm,
  cancelConfirm,
  leaveConfirm,
  transferConfirm,
  blockedDialog,
}: GroupDetailsConfirmDialogsProps) {
  const dialogs: ReadonlyArray<[string, UseConfirmDialogResult]> = [
    ["remove", removeConfirm],
    ["cancel-invitation", cancelConfirm],
    ["leave", leaveConfirm],
    ["transfer", transferConfirm],
    ["blocked", blockedDialog],
  ];

  return (
    <>
      {dialogs.map(([key, dialog]) => (
        <ConfirmDialog
          key={key}
          visible={dialog.visible}
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.cancelLabel}
          onConfirm={dialog.confirm}
          onCancel={dialog.close}
        />
      ))}
    </>
  );
}
