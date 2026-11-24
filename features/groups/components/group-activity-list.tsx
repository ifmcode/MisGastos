import { useMemo } from "react";
import { View } from "react-native";

import { GroupTimelineExpenseRow } from "@/features/group-expenses/components/group-timeline-expense-row";
import { GroupTimelineSettlementRow } from "@/features/group-expenses/components/group-timeline-settlement-row";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupActivityStyles as styles } from "../styles/group-activity.styles";
import type { GroupActivity } from "../types/group-activity.types";
import type { GroupMember } from "../types/group.types";
import { getGroupActivityDisplays } from "../utils/group-activity-display";
import type { GroupActivityEntry } from "../utils/group-activity-timeline";
import { GroupActivityRow } from "./group-activity-row";

export interface GroupActivityListProps {
  /** Merged and already sorted entries. */
  entries: readonly GroupActivityEntry[];
  activities: readonly GroupActivity[];
  members: readonly GroupMember[];
  viewerUid: string;
  onOpenExpense: (expenseId: string) => void;
  onOpenSettlement: (settlementId: string) => void;
}

/**
 * Rows of the merged register: rich record rows for active expenses and
 * settlements, and the shared event row for edits, deletions and membership.
 */
export function GroupActivityList({
  entries,
  activities,
  members,
  viewerUid,
  onOpenExpense,
  onOpenSettlement,
}: GroupActivityListProps) {
  const { t } = useScopedTranslation("groups");
  const viewerName = t("history.viewerName");
  const unknownMember = t("history.unknownMember");
  const displays = useMemo(
    () =>
      getGroupActivityDisplays(activities, {
        members,
        viewerUid,
        viewerName,
        unknownMember,
      }),
    [activities, members, unknownMember, viewerUid, viewerName],
  );
  const displayById = useMemo(
    () => new Map(displays.map((display) => [display.key, display])),
    [displays],
  );

  return (
    <View style={styles.list}>
      {entries.map((entry) => {
        if (entry.kind === "expense") {
          return (
            <GroupTimelineExpenseRow
              key={entry.key}
              entry={entry}
              members={members}
              viewerUid={viewerUid}
              onOpen={onOpenExpense}
            />
          );
        }

        if (entry.kind === "settlement") {
          return (
            <GroupTimelineSettlementRow
              key={entry.key}
              entry={entry}
              members={members}
              viewerUid={viewerUid}
              onOpen={onOpenSettlement}
            />
          );
        }

        const display = displayById.get(entry.activity.id);

        return display ? (
          <GroupActivityRow
            key={entry.key}
            activity={display}
            onOpenExpense={onOpenExpense}
            onOpenSettlement={onOpenSettlement}
          />
        ) : null;
      })}
    </View>
  );
}
