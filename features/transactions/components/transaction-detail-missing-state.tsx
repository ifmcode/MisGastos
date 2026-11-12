import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionDetailStyles as styles } from "../styles/transaction-detail.styles";

export interface TransactionDetailMissingStateProps {
  onClose: () => void;
}

/** Shown when the selected movement disappeared from the live collection. */
export function TransactionDetailMissingState({
  onClose,
}: TransactionDetailMissingStateProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["transactions", "common"]);

  return (
    <View style={styles.missingContainer}>
      <View style={styles.missingIcon}>
        <Ionicons name="document-outline" size={30} color={theme.primary} />
      </View>
      <ThemedText type="defaultSemiBold" style={styles.missingTitle}>
        {t("detail.missingTitle")}
      </ThemedText>
      <ThemedText style={[styles.missingMessage, { color: theme.muted }]}>
        {t("detail.missingMessage")}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common:accessibility.closeDetail")}
        onPress={onClose}
        style={styles.missingButton}
      >
        <ThemedText style={styles.missingButtonText}>
          {t("detail.closeButton")}
        </ThemedText>
      </Pressable>
    </View>
  );
}
