import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletFormStyles as styles } from "../styles/wallet-form.styles";

export interface WalletFormActionsProps {
  mode?: "create" | "edit";
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function WalletFormActions({
  mode = "create",
  submitting,
  onCancel,
  onSubmit,
}: WalletFormActionsProps) {
  const theme = useFormTheme();
  const isEditing = mode === "edit";
  const submitLabel = isEditing ? "Guardar cambios" : "Crear cartera";

  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isEditing ? "Cancelar edición" : "Cancelar creación de cartera"}
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
        accessibilityLabel={submitLabel}
        onPress={onSubmit}
        disabled={submitting}
        style={[styles.primaryButton, submitting && styles.disabled]}
      >
        {submitting ? (
          <ActivityIndicator color={theme.onPrimary} />
        ) : (
          <ThemedText style={styles.primaryButtonText}>{submitLabel}</ThemedText>
        )}
      </Pressable>
    </View>
  );
}
