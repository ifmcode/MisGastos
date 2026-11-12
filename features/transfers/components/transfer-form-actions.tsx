import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";

export interface TransferFormActionsProps {
  submitting: boolean;
  isEditing: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}

export function TransferFormActions({
  submitting,
  isEditing,
  canSubmit,
  onCancel,
  onSubmit,
  onDelete,
}: TransferFormActionsProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["transfers", "common"]);
  const disabled = submitting || !canSubmit;

  return (
    <View style={styles.actions}>
      {isEditing && onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("form.delete")}
          onPress={onDelete}
          disabled={submitting}
          style={[
            styles.deleteButton,
            { backgroundColor: theme.dangerSurface },
            submitting && styles.disabled,
          ]}
        >
          <Ionicons name="trash-outline" size={18} color={theme.danger} />
          <ThemedText
            style={[styles.deleteButtonText, { color: theme.danger }]}
          >
            {t("common:actions.delete")}
          </ThemedText>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("form.cancelAccessibility")}
        onPress={onCancel}
        disabled={submitting}
        style={[
          styles.secondaryButton,
          { borderColor: theme.border, backgroundColor: theme.surface },
          submitting && styles.disabled,
        ]}
      >
        <ThemedText type="defaultSemiBold">
          {t("form.cancel")}
        </ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isEditing ? t("form.saveChanges") : t("form.create")
        }
        onPress={onSubmit}
        disabled={disabled}
        style={[styles.primaryButton, disabled && styles.disabled]}
      >
        {submitting ? (
          <ActivityIndicator color={theme.onPrimary} />
        ) : (
          <ThemedText style={styles.primaryButtonText}>
            {isEditing ? t("form.save") : t("form.transfer")}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}
