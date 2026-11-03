import { ThemedText } from "@/components/themed-text";
import { DateQuickSelector } from "@/shared/components/molecules/date-quick-selector";
import { formatDateInput } from "@/shared/utils/date";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";

export interface TransferFormDateFieldProps {
  text: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (text: string) => void;
}

export function TransferFormDateField({
  text,
  value,
  error,
  disabled,
  onChange,
}: TransferFormDateFieldProps) {
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
        accessibilityLabel="Fecha de la transferencia"
        onChangeText={onChange}
        onSelectDate={(isoDate) => onChange(formatDateInput(isoDate))}
      />
    </>
  );
}
