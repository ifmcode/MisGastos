import { useTranslation } from "react-i18next";

import { DateFormField } from "@/shared/components/molecules/date-form-field";

import type { TransferValidationCode } from "../schemas/transfer.schema";

export interface TransferFormDateFieldProps {
  valueIso: string;
  error?: TransferValidationCode;
  disabled: boolean;
  onSelectDate: (isoDate: string) => void;
}

export function TransferFormDateField({
  valueIso,
  error,
  disabled,
  onSelectDate,
}: TransferFormDateFieldProps) {
  const { t } = useTranslation(["transfers", "validation"]);
  const errorText = error ? t(`validation:transfers.${error}`) : null;

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
