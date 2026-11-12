import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionDetailStyles as styles } from "../styles/transaction-detail.styles";

export interface TransactionDetailHeaderProps {
  concept: string;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TransactionDetailHeader({
  concept,
  disabled,
  onEdit,
  onDelete,
  onClose,
}: TransactionDetailHeaderProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["transactions", "common"]);

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common:accessibility.closeDetail")}
        hitSlop={10}
        onPress={onClose}
        disabled={disabled}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={24} color={theme.muted} />
      </Pressable>

      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          {t("detail.title")}
        </ThemedText>
        <ThemedText
          style={[styles.subtitle, { color: theme.muted }]}
          numberOfLines={1}
        >
          {concept}
        </ThemedText>
      </View>

      <View style={styles.headerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("detail.edit")}
          accessibilityHint={t("detail.editHint")}
          hitSlop={6}
          onPress={onEdit}
          disabled={disabled}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.primarySoft },
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <Ionicons name="pencil-outline" size={20} color={theme.primary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("detail.delete")}
          accessibilityHint={t("detail.deleteHint")}
          hitSlop={6}
          onPress={onDelete}
          disabled={disabled}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.dangerSurface },
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <Ionicons name="trash-outline" size={20} color={theme.danger} />
        </Pressable>
      </View>
    </View>
  );
}
