import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  findSettlementIncomeCategoryOption,
  type SettlementIncomeCategory,
} from "@/features/settlements/utils/settlement-form-options";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";

export interface GroupSettlementCategoryPickerDialogProps {
  visible: boolean;
  options: readonly SettlementIncomeCategory[];
  selectedId: string;
  disabled: boolean;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
}

/** Income category popup of the creditor's linked movement; it never creates. */
export function GroupSettlementCategoryPickerDialog({
  visible,
  options,
  selectedId,
  disabled,
  onSelect,
  onClose,
}: GroupSettlementCategoryPickerDialogProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groupExpenses");
  const selectedOption = findSettlementIncomeCategoryOption(options, selectedId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessible={false}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          accessibilityViewIsModal
          accessibilityLabel={t("settlementForm.categoryGroupAccessibility")}
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
              {t("settlementForm.categoryPickerTitle")}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("settlementForm.categoryPickerClose")}
              onPress={onClose}
              hitSlop={8}
              style={styles.closeButton}
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
                {t("settlementForm.categoryPickerEmpty")}
              </ThemedText>
            ) : null}

            {options.map((option) => {
              const selected = selectedOption?.id === option.id;
              const label = option.unavailable
                ? t("settlementForm.categoryUnavailable")
                : option.name;

              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled }}
                  accessibilityLabel={t(
                    "settlementForm.categoryChipAccessibility",
                    { name: label },
                  )}
                  onPress={() => onSelect(option.id)}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: selected
                        ? theme.primarySoft
                        : theme.surface,
                      borderColor: selected ? theme.primary : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={selected ? theme.primary : theme.muted}
                    accessible={false}
                  />
                  <ThemedText
                    style={[
                      styles.pickerOptionText,
                      { color: selected ? theme.primary : theme.text },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </ThemedText>
                  {selected ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={theme.primary}
                      accessible={false}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
