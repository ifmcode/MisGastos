import { Ionicons } from "@expo/vector-icons";
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
  const disabled = submitting || !canSubmit;

  return (
    <View style={styles.actions}>
      {isEditing && onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Eliminar transferencia"
          onPress={onDelete}
          disabled={submitting}
          style={[styles.deleteButton, submitting && styles.disabled]}
        >
          <Ionicons name="trash-outline" size={18} color={theme.danger} />
          <ThemedText style={styles.deleteButtonText}>Eliminar</ThemedText>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancelar transferencia"
        onPress={onCancel}
        disabled={submitting}
        style={[
          styles.secondaryButton,
          { borderColor: theme.border, backgroundColor: theme.surface },
          submitting && styles.disabled,
        ]}
      >
        <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isEditing ? "Guardar cambios" : "Crear transferencia"
        }
        onPress={onSubmit}
        disabled={disabled}
        style={[styles.primaryButton, disabled && styles.disabled]}
      >
        {submitting ? (
          <ActivityIndicator color={theme.onPrimary} />
        ) : (
          <ThemedText style={styles.primaryButtonText}>
            {isEditing ? "Guardar" : "Transferir"}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}
