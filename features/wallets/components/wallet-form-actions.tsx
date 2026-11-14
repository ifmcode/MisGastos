import { useTranslation } from "react-i18next";

import { FormActions } from "@/shared/components/molecules/form-actions";

export interface WalletFormActionsProps {
  mode?: "create" | "edit";
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function WalletFormActions({
  mode = "create",
  submitting,
  onCancel,
  onSubmit,
}: WalletFormActionsProps) {
  const { t } = useTranslation(["wallets", "common"]);
  const isEditing = mode === "edit";
  const submitLabel = isEditing ? t("form.saveChanges") : t("form.create");

  return (
    <FormActions
      submitting={submitting}
      isEditing={isEditing}
      cancelLabel={t("common:actions.cancel")}
      cancelAccessibilityLabel={
        isEditing ? t("form.cancelEdit") : t("form.cancelCreate")
      }
      submitLabel={submitLabel}
      submitAccessibilityLabel={submitLabel}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  );
}
