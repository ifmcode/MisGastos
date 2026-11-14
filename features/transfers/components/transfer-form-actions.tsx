import { useTranslation } from "react-i18next";

import { FormActions } from "@/shared/components/molecules/form-actions";

export interface TransferFormActionsProps {
  submitting: boolean;
  isEditing: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}

export function TransferFormActions({
  submitting,
  isEditing,
  canSubmit,
  onCancel,
  onSubmit,
  onDelete,
}: TransferFormActionsProps) {
  const { t } = useTranslation(["transfers", "common"]);

  return (
    <FormActions
      submitting={submitting}
      isEditing={isEditing}
      canSubmit={canSubmit}
      cancelLabel={t("form.cancel")}
      cancelAccessibilityLabel={t("form.cancelAccessibility")}
      submitLabel={isEditing ? t("form.save") : t("form.transfer")}
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
