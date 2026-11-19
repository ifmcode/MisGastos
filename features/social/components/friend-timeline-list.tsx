import { View } from "react-native";

import type { Friend } from "@/features/friends/types/friend.types";
import type { Settlement } from "@/features/settlements/types/settlement.types";
import type { SharedExpense } from "@/features/shared-expenses/types/shared-expense.types";

import { friendTimelineStyles as styles } from "../styles/friend-timeline.styles";
import type { FriendTimelineEntry } from "../utils/friend-timeline";
import { FriendTimelineExpenseRow } from "./friend-timeline-expense-row";
import { FriendTimelineSettlementRow } from "./friend-timeline-settlement-row";

export interface FriendTimelineListProps {
  entries: readonly FriendTimelineEntry[];
  friends: readonly Friend[];
  viewerUid: string;
  onOpenExpense: (expense: SharedExpense) => void;
  onOpenSettlement: (settlement: Settlement) => void;
}

/** Interleaved register: each entry keeps its own kind and destination. */
export function FriendTimelineList({
  entries,
  friends,
  viewerUid,
  onOpenExpense,
  onOpenSettlement,
}: FriendTimelineListProps) {
  return (
    <View style={styles.list}>
      {entries.map((entry) =>
        entry.kind === "expense" ? (
          <FriendTimelineExpenseRow
            key={entry.key}
            entry={entry}
            friends={friends}
            viewerUid={viewerUid}
            onOpen={onOpenExpense}
          />
        ) : (
          <FriendTimelineSettlementRow
            key={entry.key}
            entry={entry}
            friends={friends}
            viewerUid={viewerUid}
            onOpen={onOpenSettlement}
          />
        ),
      )}
    </View>
  );
}
