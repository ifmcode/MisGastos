import { useTranslation } from "react-i18next";

import { DateFormField } from "@/shared/components/molecules/date-form-field";

import type { TransactionValidationCode } from "../schemas/transaction.schema";

export interface TransactionFormDateFieldProps {
  valueIso: string;
  error?: TransactionValidationCode;
  disabled: boolean;
  onSelectDate: (isoDate: string) => void;
}

export function TransactionFormDateField({
  valueIso,
  error,
  disabled,
  onSelectDate,
}: TransactionFormDateFieldProps) {
  const { t } = useTranslation(["transactions", "validation"]);
  const errorText = error ? t(`validation:transactions.${error}`) : null;

  return (
    <DateFormField
      label={t("form.date")}
      valueIso={valueIso}
      error={errorText ?? undefined}
      accessibilityLabel={t("form.dateAccessibility")}
      disabled={disabled}
      showLastUsedDate
      onSelectDate={onSelectDate}
    />
  );
}
