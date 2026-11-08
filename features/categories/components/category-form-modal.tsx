import { Modal, View } from "react-native";

import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { confirmDialogStyles } from "@/shared/components/molecules/confirm-dialog.styles";
import { useConfirmDialog } from "@/shared/hooks/use-confirm-dialog";

import {
  CategoryInput,
  CategoryValidationErrors,
} from "../schemas/category.schema";
import { Category, CategoryType } from "../types/category.types";
import { getDeleteCategoryConfirmation } from "../utils/category-delete-dialog";
import { CategoryForm } from "./category-form";

export interface CategoryFormModalProps {
  visible: boolean;
  category: Category | null;
  defaultType: CategoryType;
  lockType?: boolean;
  presentationStyle?: "pageSheet" | "overFullScreen";
  submitting: boolean;
  error: string | null;
  fieldErrors: CategoryValidationErrors;
  onSubmit: (input: CategoryInput) => void;
  onClose: () => void;
  onDelete?: () => void;
}

/** Shared create/edit modal used by the categories screen and transaction flow. */
export function CategoryFormModal({
  visible,
  category,
  defaultType,
  lockType,
  presentationStyle = "pageSheet",
  submitting,
  error,
  fieldErrors,
  onSubmit,
  onClose,
  onDelete,
}: CategoryFormModalProps) {
  const deleteDialog = useConfirmDialog();
  const deleteConfirmation = category
    ? getDeleteCategoryConfirmation(category)
    : null;

  function requestDelete() {
    if (!deleteConfirmation || !onDelete) return;

    deleteDialog.open({
      ...deleteConfirmation,
      onConfirm: onDelete,
    });
  }

  function handleRequestClose() {
    if (deleteDialog.visible) {
      deleteDialog.close();
      return;
    }

    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={presentationStyle}
      onRequestClose={handleRequestClose}
      onDismiss={deleteDialog.close}
    >
      {visible ? (
        <View style={confirmDialogStyles.modalRoot}>
          <CategoryForm
            category={category}
            defaultType={defaultType}
            lockType={lockType}
            submitting={submitting}
            error={error}
            fieldErrors={fieldErrors}
            onSubmit={onSubmit}
            onCancel={onClose}
            onDelete={category && onDelete ? requestDelete : undefined}
          />
          <ConfirmDialog
            visible={deleteDialog.visible}
            title={deleteDialog.title}
            message={deleteDialog.message}
            confirmLabel={deleteDialog.confirmLabel}
            cancelLabel={deleteDialog.cancelLabel}
            onConfirm={deleteDialog.confirm}
            onCancel={deleteDialog.close}
          />
        </View>
      ) : null}
    </Modal>
  );
}
