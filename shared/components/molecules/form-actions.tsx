import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { formActionsStyles as styles } from "./form-actions.styles";

export interface FormActionsProps {
  submitting: boolean;
  isEditing: boolean;
  canSubmit?: boolean;
  /** Already translated labels: the shared component never owns copy. */
  cancelLabel: string;
  cancelAccessibilityLabel: string;
  submitLabel: string;
  submitAccessibilityLabel: string;
  deleteLabel?: string;
  deleteAccessibilityLabel?: string;
  onCancel: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}

/** Delete/cancel/submit row shared by the create and edit forms. */
export function FormActions({
  submitting,
  isEditing,
  canSubmit = true,
  cancelLabel,
  cancelAccessibilityLabel,
  submitLabel,
  submitAccessibilityLabel,
  deleteLabel,
  deleteAccessibilityLabel,
  onCancel,
  onSubmit,
  onDelete,
}: FormActionsProps) {
  const theme = useFormTheme();
  const disabled = submitting || !canSubmit;

  return (
    <View style={styles.actions}>
      {isEditing && onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={deleteAccessibilityLabel}
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
            {deleteLabel}
          </ThemedText>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cancelAccessibilityLabel}
        onPress={onCancel}
        disabled={submitting}
        style={[
          styles.secondaryButton,
          { borderColor: theme.border, backgroundColor: theme.surface },
          submitting && styles.disabled,
        ]}
      >
        <ThemedText type="defaultSemiBold">{cancelLabel}</ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={submitAccessibilityLabel}
        onPress={onSubmit}
        disabled={disabled}
        style={[
          styles.primaryButton,
          { backgroundColor: theme.primary },
          disabled && styles.disabled,
        ]}
      >
        {submitting ? (
          <ActivityIndicator color={theme.onPrimary} />
        ) : (
          <ThemedText
            style={[styles.primaryButtonText, { color: theme.onPrimary }]}
          >
            {submitLabel}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}
