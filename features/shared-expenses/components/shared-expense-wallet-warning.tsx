import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";

/**
 * Informational notice of a legacy viewer-paid expense saved without a wallet:
 * the record stays fully readable, it only explains why Movements has no entry.
 */
export function SharedExpenseWalletWarning() {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sharedExpenses");

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.walletWarning,
        { backgroundColor: theme.primarySoft, borderColor: theme.primary },
      ]}
    >
      <Ionicons
        name="information-circle-outline"
        size={20}
        color={theme.primary}
        accessible={false}
      />

      <View style={styles.walletWarningBody}>
        <ThemedText
          type="defaultSemiBold"
          style={[styles.walletWarningText, { color: theme.primary }]}
        >
          {t("detail.walletMissingTitle")}
        </ThemedText>
        <ThemedText style={[styles.walletWarningText, { color: theme.text }]}>
          {t("detail.walletMissingMessage")}
        </ThemedText>
      </View>
    </View>
  );
}
