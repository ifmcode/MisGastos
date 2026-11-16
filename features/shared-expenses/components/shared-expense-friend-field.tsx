import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Friend } from "@/features/friends/types/friend.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";
import { getSharedExpenseParticipantName } from "../utils/shared-expense-friends";
import { SharedExpenseFriendPickerDialog } from "./shared-expense-friend-picker-dialog";

export type SharedExpenseFriendLockReason = "editing" | "preselected";

export interface SharedExpenseFriendFieldProps {
  friends: readonly Friend[];
  selectedUid: string;
  /** Editing locks the pair: the service rejects retargeting it. */
  locked: boolean;
  /** Editing keeps the stored friend; a create entry point preselects it. */
  lockedReason?: SharedExpenseFriendLockReason;
  onSelect: (friendUid: string) => void;
}

/** Single selected friend plus the read-only picker the field opens. */
export function SharedExpenseFriendField({
  friends,
  selectedUid,
  locked,
  lockedReason = "editing",
  onSelect,
}: SharedExpenseFriendFieldProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sharedExpenses");
  const [pickerVisible, setPickerVisible] = useState(false);

  const name = selectedUid
    ? getSharedExpenseParticipantName(
        friends,
        selectedUid,
        t("friendFallback"),
      )
    : "";
  const lockedHint =
    lockedReason === "preselected"
      ? t("form.friendPreselectedHint", { name })
      : t("form.friendLockedHint");
  const hint = locked ? lockedHint : t("form.friendHint");

  function selectFriend(friendUid: string) {
    setPickerVisible(false);
    onSelect(friendUid);
  }

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.friendLabel")}</ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          name
            ? t("form.friendSelectedAccessibility", { name })
            : t("form.friendAccessibility")
        }
        accessibilityHint={hint}
        accessibilityState={{ disabled: locked }}
        disabled={locked}
        onPress={() => setPickerVisible(true)}
        style={({ pressed }) => [
          styles.selectedFriend,
          { borderColor: theme.border, backgroundColor: theme.surface },
          locked && styles.actionDisabled,
          pressed && styles.pressed,
        ]}
      >
        <ThemedText
          style={[
            styles.selectedFriendText,
            { color: name ? theme.text : theme.muted },
          ]}
          numberOfLines={1}
        >
          {name || t("form.friendPlaceholder")}
        </ThemedText>
        <Ionicons
          name={locked ? "lock-closed-outline" : "chevron-down"}
          size={18}
          color={theme.muted}
          accessible={false}
        />
      </Pressable>

      {locked ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {lockedHint}
        </ThemedText>
      ) : null}

      <SharedExpenseFriendPickerDialog
        visible={pickerVisible}
        friends={friends}
        selectedUid={selectedUid}
        onSelect={selectFriend}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
