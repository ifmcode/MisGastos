import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { categoryFormStyles as styles } from "../styles/category-form.styles";

export interface CategoryFormActionsProps {
  submitting: boolean;
  isEditing: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}

export function CategoryFormActions({
  submitting,
  isEditing,
  onCancel,
  onSubmit,
  onDelete,
}: CategoryFormActionsProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["categories", "common"]);

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
        accessibilityLabel={t("common:actions.cancel")}
        onPress={onCancel}
        disabled={submitting}
        style={[
          styles.secondaryButton,
          { borderColor: theme.border, backgroundColor: theme.surface },
          submitting && styles.disabled,
        ]}
      >
        <ThemedText type="defaultSemiBold">
          {t("common:actions.cancel")}
        </ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isEditing ? t("form.saveChanges") : t("form.create")
        }
        onPress={onSubmit}
        disabled={submitting}
        style={[styles.primaryButton, submitting && styles.disabled]}
      >
        {submitting ? (
          <ActivityIndicator color={theme.onPrimary} />
        ) : (
          <ThemedText style={styles.primaryButtonText}>
            {isEditing ? t("form.save") : t("form.create")}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}
