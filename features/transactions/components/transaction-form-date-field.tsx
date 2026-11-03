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
  return (
    <>
      <ThemedText style={styles.label}>Fecha</ThemedText>
      <DateQuickSelector
        text={text}
        valueIso={value}
        error={error}
        disabled={disabled}
        helperText="Toca Hoy o Ayer, o elige otra fecha."
        showLastUsedDate
        accessibilityLabel="Fecha"
        onChangeText={onChange}
        onSelectDate={(isoDate) => onChange(formatDateInput(isoDate))}
      />
    </>
  );
}
