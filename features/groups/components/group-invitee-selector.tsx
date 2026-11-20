import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Friend } from "@/features/friends/types/friend.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { joinMetaParts } from "@/shared/utils/join-meta";

import { groupsStyles as styles } from "../styles/groups.styles";
import { GroupInviteeRow } from "./group-invitee-row";

export interface GroupInviteeSelectorProps {
  /** Accepted friends offered as invitees. */
  friends: readonly Friend[];
  selectedIds: readonly string[];
  /** Remaining seats: 19 on create, the free seats on an extra invite round. */
  maxSelected: number;
  /** Already translated helper; defaults to the creation explanation. */
  helper?: string;
  error?: string | null;
  disabled?: boolean;
  onToggle: (uid: string) => void;
}

/**
 * Multi-select of accepted friends. It never queries: the caller already
 * filtered the eligible friends and passes the remaining capacity.
 */
export function GroupInviteeSelector({
  friends,
  selectedIds,
  maxSelected,
  helper,
  error,
  disabled = false,
  onToggle,
}: GroupInviteeSelectorProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const atLimit = selectedIds.length >= maxSelected;
  const remaining = Math.max(maxSelected - selectedIds.length, 0);
  const count = joinMetaParts([
    t("form.inviteesSelected", { count: selectedIds.length }),
    remaining === 0
      ? t("form.inviteesFull")
      : t("form.inviteesRemaining", { count: remaining }),
  ]);

  return (
    <View>
      <View style={styles.inviteesHeader}>
        <ThemedText style={styles.fieldLabel}>
          {t("form.inviteesLabel")}
        </ThemedText>
        <ThemedText
          style={[
            styles.inviteesCount,
            { color: atLimit ? theme.warningText : theme.muted },
          ]}
        >
          {count}
        </ThemedText>
      </View>

      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {helper ?? t("form.inviteesHelper")}
      </ThemedText>

      {friends.length === 0 ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("form.inviteesEmptyFriends")}
        </ThemedText>
      ) : (
        <View style={styles.inviteeList}>
          {friends.map((friend) => (
            <GroupInviteeRow
              key={friend.uid}
              friend={friend}
              selected={selectedIds.includes(friend.uid)}
              disabled={
                disabled ||
                (atLimit && !selectedIds.includes(friend.uid))
              }
              onToggle={onToggle}
            />
          ))}
        </View>
      )}

      {error ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
