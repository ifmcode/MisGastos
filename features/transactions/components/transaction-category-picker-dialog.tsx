import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";
import { TransactionCategory } from "../utils/transaction-options";
import { TransactionCategoryPickerOption } from "./transaction-category-picker-option";

export interface TransactionCategoryPickerDialogProps {
  visible: boolean;
  categories: readonly TransactionCategory[];
  value: string;
  disabled: boolean;
  onSelect: (categoryId: string) => void;
  onCreate: () => void;
  onClose: () => void;
}

/**
 * Full-category popup opened from the compact selector. It lists every
 * category of the current movement type and keeps the inline creation action.
 */
export function TransactionCategoryPickerDialog({
  visible,
  categories,
  value,
  disabled,
  onSelect,
  onCreate,
  onClose,
}: TransactionCategoryPickerDialogProps) {
  const theme = useFormTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.pickerOverlay}>
        <Pressable
          accessible={false}
          onPress={onClose}
          style={styles.pickerBackdrop}
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[
            styles.pickerCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.pickerHeader}>
            <ThemedText
              type="defaultSemiBold"
              accessibilityRole="header"
              style={styles.pickerTitle}
            >
              Seleccionar categoría
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector de categoría"
              onPress={onClose}
              hitSlop={8}
              style={styles.pickerCloseButton}
            >
              <Ionicons name="close" size={20} color={theme.muted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.pickerList}
            contentContainerStyle={styles.pickerListContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {categories.length === 0 ? (
              <ThemedText style={[styles.helper, { color: theme.muted }]}>
                No hay categorías para este tipo. Crea una con Nueva.
              </ThemedText>
            ) : null}

            {categories.map((category) => (
              <TransactionCategoryPickerOption
                key={category.id}
                category={category}
                selected={value === category.id}
                disabled={disabled}
                onSelect={onSelect}
              />
            ))}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crear categoría"
            onPress={onCreate}
            disabled={disabled}
            style={({ pressed }) => [
              styles.pickerCreateButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pickerOptionPressed,
            ]}
          >
            <Ionicons name="add" size={20} color={theme.primary} />
            <ThemedText
              style={[styles.pickerCreateText, { color: theme.primary }]}
            >
              Nueva
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
