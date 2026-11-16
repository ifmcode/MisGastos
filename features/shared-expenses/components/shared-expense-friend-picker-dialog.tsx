import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Friend } from "@/features/friends/types/friend.types";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";

export interface SharedExpenseFriendPickerDialogProps {
  visible: boolean;
  friends: readonly Friend[];
  selectedUid: string;
  onSelect: (friendUid: string) => void;
  onClose: () => void;
}

/**
 * Read-only friend popup opened from the compact friend field. It lists every
 * accepted friend exactly once and never creates friendships.
 */
export function SharedExpenseFriendPickerDialog({
  visible,
  friends,
  selectedUid,
  onSelect,
  onClose,
}: SharedExpenseFriendPickerDialogProps) {
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
            {friends.length === 0 ? (
              <ThemedText style={[styles.helper, { color: theme.muted }]}>
                {t("form.pickerEmpty")}
              </ThemedText>
            ) : null}

            {friends.map((friend) => {
              const selected = selectedUid === friend.uid;
              const name = getFriendDisplayName(friend);

              return (
                <Pressable
                  key={friend.uid}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t("form.pickerOptionAccessibility", {
                    name,
                  })}
                  onPress={() => onSelect(friend.uid)}
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
                      {name}
                    </ThemedText>
                    {friend.email ? (
                      <ThemedText
                        style={[styles.optionMeta, { color: theme.muted }]}
                        numberOfLines={1}
                      >
                        {friend.email}
                      </ThemedText>
                    ) : null}
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
