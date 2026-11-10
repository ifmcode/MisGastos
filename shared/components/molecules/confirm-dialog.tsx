import { useEffect } from "react";
import { Keyboard, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { confirmDialogStyles as styles } from "./confirm-dialog.styles";

export type ConfirmDialogTone = "danger" | "primary";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  onConfirm: () => void;
  onCancel: () => void;
}

/** In-app confirmation card rendered on top of the current modal content. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useFormTheme();
  const confirmColor = tone === "primary" ? theme.primary : theme.danger;

  useEffect(() => {
    if (visible) Keyboard.dismiss();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable
        accessible={false}
        onPress={onCancel}
        style={styles.backdrop}
      />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onCancel}
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <ThemedText
          type="defaultSemiBold"
          accessibilityRole="header"
          style={styles.title}
        >
          {title}
        </ThemedText>
        <ThemedText style={[styles.message, { color: theme.muted }]}>
          {message}
        </ThemedText>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            onPress={onCancel}
            style={({ pressed }) => [
              styles.button,
              styles.cancelButton,
              { borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText type="defaultSemiBold">{cancelLabel}</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.button,
              styles.confirmButton,
              { backgroundColor: confirmColor },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText style={styles.confirmButtonText}>
              {confirmLabel}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
