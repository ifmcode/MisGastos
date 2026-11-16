import { View } from "react-native";

import type { Friend } from "@/features/friends/types/friend.types";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";
import type { SharedExpense } from "../types/shared-expense.types";
import { SharedExpenseRow } from "./shared-expense-row";

export interface SharedExpensesListProps {
  friends: readonly Friend[];
  expenses: readonly SharedExpense[];
  viewerUid: string;
  pendingId: string | null;
  onEdit: (expense: SharedExpense) => void;
  onDelete: (expense: SharedExpense) => void;
}

/** Active expenses with their empty state. */
export function SharedExpensesList({
  friends,
  expenses,
  viewerUid,
  pendingId,
  onEdit,
  onDelete,
}: SharedExpensesListProps) {
  const { t } = useScopedTranslation("sharedExpenses");

  if (expenses.length === 0) {
    return (
      <EmptyState
        variant="card"
        title={t("empty.noExpensesTitle")}
        message={t("empty.noExpensesMessage")}
      />
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
