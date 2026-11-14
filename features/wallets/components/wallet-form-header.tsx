import { useTranslation } from "react-i18next";

import { FormHeader } from "@/shared/components/molecules/form-header";

export interface WalletFormHeaderProps {
  mode?: "create" | "edit";
  disabled: boolean;
  onClose: () => void;
}

export function WalletFormHeader({
  mode = "create",
  disabled,
  onClose,
}: WalletFormHeaderProps) {
  const { t } = useTranslation(["wallets", "common"]);
  const isEditing = mode === "edit";

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
