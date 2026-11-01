import { Modal } from "react-native";

import {
  CategoryInput,
  CategoryValidationErrors,
} from "../schemas/category.schema";
import { Category, CategoryType } from "../types/category.types";
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
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
    >
      {visible ? (
        <CategoryForm
          category={category}
          defaultType={defaultType}
          lockType={lockType}
          submitting={submitting}
          error={error}
          fieldErrors={fieldErrors}
          onSubmit={onSubmit}
          onCancel={onClose}
          onDelete={category ? onDelete : undefined}
        />
      ) : null}
    </Modal>
  );
}
