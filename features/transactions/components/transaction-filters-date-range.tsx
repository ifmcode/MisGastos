import { TextInput, View } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFiltersStyles as styles } from "../styles/transaction-filters.styles";

export interface TransactionFiltersDateRangeProps {
  fromText: string;
  toText: string;
  onChangeFrom: (text: string) => void;
  onChangeTo: (text: string) => void;
}

export function TransactionFiltersDateRange({
  fromText,
  toText,
  onChangeFrom,
  onChangeTo,
}: TransactionFiltersDateRangeProps) {
  const theme = useFormTheme();
  const inputStyle = [
    styles.dateInput,
    {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      color: theme.text,
    },
  ];

  return (
    <View style={styles.dateRow}>
      <TextInput
        value={fromText}
        onChangeText={onChangeFrom}
        placeholder="Desde DD/MM/AAAA"
        placeholderTextColor={theme.muted}
        style={inputStyle}
      />
      <TextInput
        value={toText}
        onChangeText={onChangeTo}
        placeholder="Hasta DD/MM/AAAA"
        placeholderTextColor={theme.muted}
        style={inputStyle}
      />
    </View>
  );
}
