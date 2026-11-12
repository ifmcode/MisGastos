import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormHeaderProps {
  isEditing: boolean;
  disabled: boolean;
  onClose: () => void;
}

export function TransactionFormHeader({
  isEditing,
  disabled,
  onClose,
}: TransactionFormHeaderProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["transactions", "common"]);

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          {isEditing ? t("form.editTitle") : t("form.createTitle")}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
          {isEditing ? t("form.editSubtitle") : t("form.createSubtitle")}
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common:accessibility.closeForm")}
        hitSlop={10}
        onPress={onClose}
        disabled={disabled}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={24} color={theme.muted} />
      </Pressable>
    </View>
  );
}
