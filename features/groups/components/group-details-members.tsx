import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupMemberActionsController } from "../hooks/use-group-member-actions";
import { groupsStyles as styles } from "../styles/groups.styles";
import type { GroupMember } from "../types/group.types";
import { GroupMemberRow } from "./group-member-row";

export interface GroupDetailsMembersProps {
  members: readonly GroupMember[];
  isOwner: boolean;
  /** True while any moderation action of the sheet is in flight. */
  busy: boolean;
  memberActions: GroupMemberActionsController;
}

/**
 * Members section of the details sheet. Only the owner sees the transfer and
 * remove actions, and the pending member shows the spinner of its own action.
 */
export function GroupDetailsMembers({
  members,
  isOwner,
  busy,
  memberActions,
}: GroupDetailsMembersProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");

  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: theme.muted }]}>
        {t("details.membersLabel")}
      </ThemedText>
      {members.map((member) => {
        const pendingAction =
          memberActions.pendingId === member.uid
            ? memberActions.pendingAction
            : null;

        return (
          <GroupMemberRow
            key={member.uid}
            member={member}
            canRemove={isOwner && member.role !== "owner"}
            canTransfer={isOwner && member.role !== "owner"}
            busy={busy}
            removing={pendingAction === "remove"}
            transferring={pendingAction === "transfer"}
            onRemove={memberActions.requestRemove}
            onTransfer={memberActions.requestTransfer}
          />
        );
      })}
    </View>
  );
}
