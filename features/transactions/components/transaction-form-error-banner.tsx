import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormErrorBannerProps {
  error?: string | null;
}

export function TransactionFormErrorBanner({
  error,
}: TransactionFormErrorBannerProps) {
  const theme = useFormTheme();

  if (!error) return null;

  return (
    <View
      style={[styles.errorBanner, { backgroundColor: theme.dangerSurface }]}
    >
      <Ionicons name="alert-circle" size={20} color={theme.danger} />
      <ThemedText style={[styles.errorBannerText, { color: theme.dangerText }]}>
        {error}
      </ThemedText>
    </View>
  );
}
