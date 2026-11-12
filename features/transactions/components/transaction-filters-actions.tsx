import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFiltersStyles as styles } from "../styles/transaction-filters.styles";

export interface TransactionFiltersActionsProps {
  onReset: () => void;
  onApply: () => void;
}

export function TransactionFiltersActions({
  onReset,
  onApply,
}: TransactionFiltersActionsProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("transactions");

  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("filters.resetAccessibility")}
        onPress={onReset}
        style={[
          styles.secondaryButton,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
      >
        <ThemedText type="defaultSemiBold">{t("filters.reset")}</ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("filters.applyAccessibility")}
        onPress={onApply}
        style={styles.primaryButton}
      >
        <ThemedText style={styles.primaryButtonText}>
          {t("filters.apply")}
        </ThemedText>
      </Pressable>
    </View>
  );
}
