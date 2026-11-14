import { useTranslation } from "react-i18next";

import { FormHeader } from "@/shared/components/molecules/form-header";

export interface TransactionFormHeaderProps {
  isEditing: boolean;
  disabled: boolean;
  onClose: () => void;
}

export function TransactionFormHeader({
  isEditing,
  disabled,
  onClose,
}: TransactionFormHeaderProps) {
  const { t } = useTranslation(["transactions", "common"]);

  return (
    <FormHeader
      title={isEditing ? t("form.editTitle") : t("form.createTitle")}
      subtitle={isEditing ? t("form.editSubtitle") : t("form.createSubtitle")}
      closeAccessibilityLabel={t("common:accessibility.closeForm")}
      disabled={disabled}
      onClose={onClose}
    />
  );
}
