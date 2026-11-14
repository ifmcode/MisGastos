import { useTranslation } from "react-i18next";

import { FormHeader } from "@/shared/components/molecules/form-header";

export interface TransactionFiltersHeaderProps {
  onClose: () => void;
}

export function TransactionFiltersHeader({
  onClose,
}: TransactionFiltersHeaderProps) {
  const { t } = useTranslation("transactions");

  return (
    <FormHeader
      title={t("filters.title")}
      subtitle={t("filters.subtitle")}
      closeAccessibilityLabel={t("filters.close")}
      onClose={onClose}
    />
  );
}
