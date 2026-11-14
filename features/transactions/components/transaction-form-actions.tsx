import { useTranslation } from "react-i18next";

import { FormActions } from "@/shared/components/molecules/form-actions";

export interface TransactionFormActionsProps {
  submitting: boolean;
  isEditing: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}

export function TransactionFormActions({
  submitting,
  isEditing,
  canSubmit,
  onCancel,
  onSubmit,
  onDelete,
}: TransactionFormActionsProps) {
  const { t } = useTranslation(["transactions", "common"]);

  return (
    <FormActions
      submitting={submitting}
      isEditing={isEditing}
      canSubmit={canSubmit}
      cancelLabel={t("common:actions.cancel")}
      cancelAccessibilityLabel={t("common:actions.cancel")}
      submitLabel={isEditing ? t("form.save") : t("form.createShort")}
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
