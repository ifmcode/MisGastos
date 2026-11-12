import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionsStyles as styles } from "../styles/transactions.styles";

export interface TransactionsErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function TransactionsErrorState({
  message,
  onRetry,
}: TransactionsErrorStateProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["transactions", "common"]);

  return (
    <View style={styles.centered}>
      <Ionicons
        name="cloud-offline-outline"
        size={42}
        color={theme.danger}
      />
      <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
        {t("errorTitle")}
      </ThemedText>
      <ThemedText style={styles.centeredText}>{message}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("retryAccessibility")}
        onPress={onRetry}
        style={styles.retryButton}
      >
        <ThemedText style={styles.retryButtonText}>
          {t("common:actions.retry")}
        </ThemedText>
      </Pressable>
    </View>
  );
}
