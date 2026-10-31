import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";

export interface TransferFormHeaderProps {
  isEditing: boolean;
  disabled: boolean;
  onClose: () => void;
}

export function TransferFormHeader({
  isEditing,
  disabled,
  onClose,
}: TransferFormHeaderProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          {isEditing ? "Editar transferencia" : "Nueva transferencia"}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
          {isEditing
            ? "Ajusta las carteras, el importe o los datos del movimiento."
            : "Mueve dinero entre tus propias carteras."}
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar formulario"
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
