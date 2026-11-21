import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { formatCurrencyLabel } from "@/shared/utils/currency-label";
import type { Group } from "@/features/groups/types/group.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { joinMetaParts } from "@/shared/utils/join-meta";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";

export interface GroupExpenseGroupPickerDialogProps {
  visible: boolean;
  groups: readonly Group[];
  selectedId: string;
  onSelect: (groupId: string) => void;
  onClose: () => void;
}

/**
 * Read-only group popup of the movements entry point. It lists every group the
 * viewer belongs to with its member count and never creates a group.
 */
export function GroupExpenseGroupPickerDialog({
  visible,
  groups,
  selectedId,
  onSelect,
  onClose,
}: GroupExpenseGroupPickerDialogProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groupExpenses");

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
              {t("form.pickerTitle")}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("form.pickerClose")}
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
            {groups.length === 0 ? (
              <ThemedText style={[styles.helper, { color: theme.muted }]}>
                {t("form.pickerEmpty")}
              </ThemedText>
            ) : null}

            {groups.map((group) => {
              const selected = selectedId === group.id;
              const meta = joinMetaParts([
                t("form.pickerOptionMeta", { count: group.memberIds.length }),
                formatCurrencyLabel(group.defaultCurrency),
              ]);

              return (
                <Pressable
                  key={group.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t("form.pickerOptionAccessibility", {
                    name: group.name,
                  })}
                  onPress={() => onSelect(group.id)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: selected
                        ? theme.primarySoft
                        : theme.background,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.rowBody}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>
                      {group.name}
                    </ThemedText>
                    <ThemedText
                      style={[styles.optionMeta, { color: theme.muted }]}
                      numberOfLines={1}
                    >
                      {meta}
                    </ThemedText>
                  </View>
                  {selected ? (
                    <Ionicons
                      name="checkmark"
                      size={20}
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
