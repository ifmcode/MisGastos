import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { formFieldStyles } from "@/shared/components/molecules/form-field.styles";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";
import {
  getTransactionCategoryLabel,
  TransactionCategory,
} from "../utils/transaction-options";
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
  const { t } = useTranslation("transactions");

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
              {t("categoryPicker.title")}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("categoryPicker.close")}
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
              <ThemedText style={[formFieldStyles.helper, { color: theme.muted }]}>
                {t("categoryPicker.empty")}
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
            accessibilityLabel={t("categoryPicker.create")}
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
              {t("categoryPicker.new")}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
