import { useTranslation } from "react-i18next";

import { FormActions } from "@/shared/components/molecules/form-actions";

export interface CategoryFormActionsProps {
  submitting: boolean;
  isEditing: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}

export function CategoryFormActions({
  submitting,
  isEditing,
  onCancel,
  onSubmit,
  onDelete,
}: CategoryFormActionsProps) {
  const { t } = useTranslation(["categories", "common"]);

  return (
    <FormActions
      submitting={submitting}
      isEditing={isEditing}
      cancelLabel={t("common:actions.cancel")}
      cancelAccessibilityLabel={t("common:actions.cancel")}
      submitLabel={isEditing ? t("form.save") : t("form.create")}
      submitAccessibilityLabel={
        isEditing ? t("form.saveChanges") : t("form.create")
      }
      deleteLabel={t("common:actions.delete")}
      deleteAccessibilityLabel={t("form.delete")}
      onCancel={onCancel}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  );
}
