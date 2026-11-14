import { useTranslation } from "react-i18next";

import { DateFormField } from "@/shared/components/molecules/date-form-field";

export interface TransactionFormDateFieldProps {
  text: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (text: string) => void;
}

export function TransactionFormDateField({
  text,
  value,
  error,
  disabled,
  onChange,
}: TransactionFormDateFieldProps) {
  const { t } = useTranslation("transactions");

  return (
    <DateFormField
      label={t("form.date")}
      text={text}
      value={value}
      error={error}
      helperText={t("form.dateHelper")}
      accessibilityLabel={t("form.dateAccessibility")}
      disabled={disabled}
      showLastUsedDate
      onChange={onChange}
    />
  );
}
