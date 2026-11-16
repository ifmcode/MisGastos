import { View } from "react-native";

import type { Friend } from "@/features/friends/types/friend.types";
import { EmptyState } from "@/shared/components/molecules/empty-state";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";
import type { SharedExpense } from "../types/shared-expense.types";
import { SharedExpenseRow } from "./shared-expense-row";

export interface FriendSharedExpensesListProps {
  expenses: readonly SharedExpense[];
  friends: readonly Friend[];
  viewerUid: string;
  /** Id of the expense with an operation in flight, if any. */
  pendingId: string | null;
  /** Already translated empty copy: each surface owns its own tone. */
  emptyTitle: string;
  emptyMessage: string;
  onEdit: (expense: SharedExpense) => void;
  onDelete: (expense: SharedExpense) => void;
}

/**
 * Expenses of one friend pair, without a friend picker and without a section
 * header, so the friend detail and any later surface can share it.
 */
export function FriendSharedExpensesList({
  expenses,
  friends,
  viewerUid,
  pendingId,
  emptyTitle,
  emptyMessage,
  onEdit,
  onDelete,
}: FriendSharedExpensesListProps) {
  if (expenses.length === 0) {
    return (
      <EmptyState variant="card" title={emptyTitle} message={emptyMessage} />
    );
  }

  return (
    <View style={styles.list}>
      {expenses.map((expense) => (
        <SharedExpenseRow
          key={expense.id}
          expense={expense}
          friends={friends}
          viewerUid={viewerUid}
          pendingId={pendingId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}
