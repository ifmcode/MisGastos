import { useCallback } from "react";

import {
  useConfirmDialog,
  type UseConfirmDialogResult,
} from "@/shared/hooks/use-confirm-dialog";
import type { DetailDeleteConfirmation } from "@/shared/types/detail.types";

export interface UseDetailActionsOptions {
  /** Copy of the delete confirmation; when null the action is a no-op. */
  deleteConfirmation: DetailDeleteConfirmation | null;
  /** Performs the deletion and tells the detail whether it can close. */
  onConfirmDelete: () => Promise<boolean>;
  onClose: () => void;
}

export interface DetailActionsController {
  confirm: UseConfirmDialogResult;
  /** Opens the confirmation with the already translated copy. */
  requestDelete: () => void;
  /** Closes the dialog and then the detail, in that order. */
  closeDetail: () => void;
}

/**
 * Confirmed delete flow shared by `DetailModal` and the detail routes: the
 * detail only leaves after the mutation reported success, so a failure keeps
 * the record and its error banner on screen.
 */
export function useDetailActions({
  deleteConfirmation,
  onConfirmDelete,
  onClose,
}: UseDetailActionsOptions): DetailActionsController {
  const confirm = useConfirmDialog();
  const { open, close } = confirm;

  const closeDetail = useCallback(() => {
    close();
    onClose();
  }, [close, onClose]);

  const confirmDelete = useCallback(async () => {
    const deleted = await onConfirmDelete();
    if (deleted) closeDetail();
  }, [closeDetail, onConfirmDelete]);

  const requestDelete = useCallback(() => {
    if (!deleteConfirmation) return;

    open({
      title: deleteConfirmation.title,
      message: deleteConfirmation.message,
      onConfirm: () => {
        void confirmDelete();
      },
    });
  }, [confirmDelete, deleteConfirmation, open]);

  return { confirm, requestDelete, closeDetail };
}
