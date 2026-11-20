import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Friend } from "@/features/friends/types/friend.types";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupsStyles as styles } from "../styles/groups.styles";

export interface GroupInviteeRowProps {
  friend: Friend;
  selected: boolean;
  /** True when the invitee limit is reached and this friend is not selected. */
  disabled: boolean;
  onToggle: (uid: string) => void;
}

/** Checkbox row of the group invitee multi-select. */
export function GroupInviteeRow({
  friend,
  selected,
  disabled,
  onToggle,
}: GroupInviteeRowProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const name = getFriendDisplayName(friend);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={t("form.inviteesAccessibility", { name })}
      accessibilityHint={
        selected
          ? t("form.inviteesCheckedHint", { name })
          : t("form.inviteesUncheckedHint", { name })
      }
      disabled={disabled}
      onPress={() => onToggle(friend.uid)}
      style={({ pressed }) => [
        styles.inviteeRow,
        {
          borderColor: selected ? theme.primary : theme.border,
          backgroundColor: selected ? theme.primarySoft : theme.surface,
        },
        disabled && styles.actionDisabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.inviteeBody}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {name}
        </ThemedText>
        {friend.email ? (
          <ThemedText
            style={[styles.rowMeta, { color: theme.muted }]}
            numberOfLines={1}
          >
            {friend.email}
          </ThemedText>
        ) : null}
      </View>

      <View
        style={[
          styles.checkbox,
          {
            borderColor: selected ? theme.primary : theme.border,
            backgroundColor: selected ? theme.primary : theme.surface,
          },
        ]}
      >
        {selected ? (
          <Ionicons
            name="checkmark"
            size={16}
            color={theme.onPrimary}
            accessible={false}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
