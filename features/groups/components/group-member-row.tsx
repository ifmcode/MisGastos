import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupsStyles as styles } from "../styles/groups.styles";
import type { GroupMember } from "../types/group.types";
import { GroupMemberRowActions } from "./group-member-actions";

export interface GroupMemberRowProps {
  member: GroupMember;
  /** Owner-only: the owner has no transfer nor remove action. */
  canRemove: boolean;
  canTransfer: boolean;
  /** True while any moderation action is in flight. */
  busy: boolean;
  /** True while this member is the one being removed. */
  removing: boolean;
  /** True while this member is the one receiving the ownership. */
  transferring: boolean;
  onRemove: (member: GroupMember) => void;
  onTransfer: (member: GroupMember) => void;
}

/** Member row of the details sheet with its role and owner-only actions. */
export function GroupMemberRow({
  member,
  canRemove,
  canTransfer,
  busy,
  removing,
  transferring,
  onRemove,
  onTransfer,
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

      <GroupMemberRowActions
        name={name}
        busy={busy}
        removing={removing}
        transferring={transferring}
        canRemove={canRemove}
        canTransfer={canTransfer}
        onRemove={() => onRemove(member)}
        onTransfer={() => onTransfer(member)}
      />
    </View>
  );
}
