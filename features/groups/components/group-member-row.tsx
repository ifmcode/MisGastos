import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupsStyles as styles } from "../styles/groups.styles";
import type { GroupMember } from "../types/group.types";

export interface GroupMemberRowProps {
  member: GroupMember;
  /** Owner-only: the owner can never be removed, so it stays false for them. */
  canRemove: boolean;
  /** True while any moderation action is in flight. */
  busy: boolean;
  /** True while this member is the one being removed. */
  removing: boolean;
  onRemove: (member: GroupMember) => void;
}

/** Member row of the details sheet with its owner/member role and action. */
export function GroupMemberRow({
  member,
  canRemove,
  busy,
  removing,
  onRemove,
}: GroupMemberRowProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const name = getFriendDisplayName(member);
  const isOwner = member.role === "owner";

  return (
    <View style={[styles.memberRow, { borderColor: theme.border }]}>
      <View style={styles.memberBody}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {name}
        </ThemedText>
        <View style={styles.memberMetaRow}>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: isOwner
                  ? theme.primarySoft
                  : theme.background,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.roleBadgeText,
                { color: isOwner ? theme.primary : theme.muted },
              ]}
            >
              {isOwner ? t("details.ownerBadge") : t("details.memberBadge")}
            </ThemedText>
          </View>
          {member.email ? (
            <ThemedText
              style={[styles.rowMeta, { color: theme.muted }]}
              numberOfLines={1}
            >
              {member.email}
            </ThemedText>
          ) : null}
        </View>
      </View>

      {canRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("details.removeAccessibility", { name })}
          accessibilityHint={
            removing ? t("details.removingHint") : t("details.removeHint")
          }
          accessibilityState={{ busy: removing, disabled: busy }}
          disabled={busy}
          onPress={() => onRemove(member)}
          style={({ pressed }) => [
            styles.rowAction,
            busy && !removing && styles.actionDisabled,
            pressed && styles.pressed,
          ]}
        >
          {removing ? (
            <ActivityIndicator size="small" color={theme.danger} />
          ) : (
            <Ionicons
              name="person-remove-outline"
              size={20}
              color={theme.danger}
              accessible={false}
            />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
