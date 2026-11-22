import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { settlementsStyles as styles } from "../styles/settlements.styles";
import {
  findSettlementIncomeCategoryOption,
  type SettlementIncomeCategory,
} from "../utils/settlement-form-options";
import { SettlementCategoryPickerOption } from "./settlement-category-picker-option";

export interface SettlementCategoryPickerDialogProps {
  visible: boolean;
  options: readonly SettlementIncomeCategory[];
  selectedId: string;
  disabled: boolean;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
}

/** Full income category popup; it never creates categories. */
export function SettlementCategoryPickerDialog({
  visible,
  options,
  selectedId,
  disabled,
  onSelect,
  onClose,
}: SettlementCategoryPickerDialogProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("settlements");
  const selectedOption = findSettlementIncomeCategoryOption(options, selectedId);

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
          accessibilityLabel={t("form.categoryGroupAccessibility")}
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
              <ThemedText style={[styles.helper, { color: theme.muted }]}>
                {t("form.categoryPickerEmpty")}
              </ThemedText>
            ) : null}

            {options.map((option) => (
              <SettlementCategoryPickerOption
                key={option.id}
                option={option}
                selected={selectedOption?.id === option.id}
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
