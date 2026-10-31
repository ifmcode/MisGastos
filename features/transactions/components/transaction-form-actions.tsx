import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormActionsProps {
  submitting: boolean;
  isEditing: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}

export function TransactionFormActions({
  submitting,
  isEditing,
  canSubmit,
  onCancel,
  onSubmit,
  onDelete,
}: TransactionFormActionsProps) {
  const theme = useFormTheme();
  const disabled = submitting || !canSubmit;

  return (
    <View style={styles.actions}>
      {isEditing && onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Eliminar movimiento"
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
        accessibilityLabel="Cancelar"
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
        accessibilityLabel={isEditing ? "Guardar cambios" : "Crear movimiento"}
        onPress={onSubmit}
        disabled={disabled}
        style={[styles.primaryButton, disabled && styles.disabled]}
      >
        {submitting ? (
          <ActivityIndicator color={theme.onPrimary} />
        ) : (
          <ThemedText style={styles.primaryButtonText}>
            {isEditing ? "Guardar" : "Crear"}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}
