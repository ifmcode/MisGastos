import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { linkedMovementStyles as styles } from "../styles/shared-expense-linked-movement.styles";
import type { SharedExpenseCategoryOption } from "../utils/shared-expense-link-options";
import { SharedExpenseCategoryPickerOption } from "./shared-expense-category-picker-option";

export interface SharedExpenseCategoryPickerDialogProps {
  visible: boolean;
  options: readonly SharedExpenseCategoryOption[];
  selectedId: string;
  disabled: boolean;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
}

/** Full linked-movement category popup; it never creates categories. */
export function SharedExpenseCategoryPickerDialog({
  visible,
  options,
  selectedId,
  disabled,
  onSelect,
  onClose,
}: SharedExpenseCategoryPickerDialogProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sharedExpenses");

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
              {t("form.categoryPickerTitle")}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("form.categoryPickerClose")}
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
            {options.length === 0 ? (
              <ThemedText style={{ color: theme.muted }}>
                {t("form.categoryPickerEmpty")}
              </ThemedText>
            ) : null}

            {options.map((option) => (
              <SharedExpenseCategoryPickerOption
                key={option.id}
                option={option}
                selected={selectedId === option.id}
                disabled={disabled}
                onSelect={onSelect}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
