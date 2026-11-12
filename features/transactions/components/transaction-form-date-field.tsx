import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { DateQuickSelector } from "@/shared/components/molecules/date-quick-selector";
import { formatDateInput } from "@/shared/utils/date";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

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
    <>
      <ThemedText style={styles.label}>{t("form.date")}</ThemedText>
      <DateQuickSelector
        text={text}
        valueIso={value}
        error={error}
        disabled={disabled}
        helperText={t("form.dateHelper")}
        showLastUsedDate
        accessibilityLabel={t("form.dateAccessibility")}
        onChangeText={onChange}
        onSelectDate={(isoDate) => onChange(formatDateInput(isoDate))}
      />
    </>
  );
}
