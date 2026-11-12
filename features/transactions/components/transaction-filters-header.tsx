import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFiltersStyles as styles } from "../styles/transaction-filters.styles";

export interface TransactionFiltersHeaderProps {
  onClose: () => void;
}

export function TransactionFiltersHeader({
  onClose,
}: TransactionFiltersHeaderProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["transactions", "common"]);

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          {t("filters.title")}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
          {t("filters.subtitle")}
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("filters.close")}
        hitSlop={10}
        onPress={onClose}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={24} color={theme.muted} />
      </Pressable>
    </View>
  );
}
