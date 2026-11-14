import { useTranslation } from "react-i18next";

import { FormHeader } from "@/shared/components/molecules/form-header";

export interface CategoryFormHeaderProps {
  isEditing: boolean;
  disabled: boolean;
  onClose: () => void;
}

export function CategoryFormHeader({
  isEditing,
  disabled,
  onClose,
}: CategoryFormHeaderProps) {
  const { t } = useTranslation(["categories", "common"]);

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
