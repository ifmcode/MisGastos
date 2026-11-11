import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionDetailStyles as styles } from "../styles/transaction-detail.styles";
import { Transaction } from "../types/transaction.types";

export interface TransactionDetailHeaderProps {
  transaction: Transaction;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TransactionDetailHeader({
  transaction,
  disabled,
  onEdit,
  onDelete,
  onClose,
}: TransactionDetailHeaderProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar detalle"
        hitSlop={10}
        onPress={onClose}
        disabled={disabled}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={24} color={theme.muted} />
      </Pressable>

      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          Detalle del movimiento
        </ThemedText>
        <ThemedText
          style={[styles.subtitle, { color: theme.muted }]}
          numberOfLines={1}
        >
          {transaction.concept}
        </ThemedText>
      </View>

      <View style={styles.headerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar movimiento"
          accessibilityHint="Abre el formulario con este movimiento."
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
          accessibilityLabel="Eliminar movimiento"
          accessibilityHint="Pide confirmación antes de eliminar el movimiento y revertir el saldo."
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
