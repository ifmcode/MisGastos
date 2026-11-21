import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { GroupMember } from "@/features/groups/types/group.types";
import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";
import { GroupExpenseRow } from "./group-expense-row";

export interface GroupExpensesSectionProps {
  expenses: readonly GroupExpense[];
  members: readonly GroupMember[];
  viewerUid: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** The row only navigates; edit and delete live in the expense detail. */
  onOpenExpense: (expense: GroupExpense) => void;
}

/**
 * Expenses of one group inside the group detail: title and count, the loading,
 * error and empty states, and the active expenses newest first.
 */
export function GroupExpensesSection({
  expenses,
  members,
  viewerUid,
  loading,
  error,
  onRetry,
  onOpenExpense,
}: GroupExpensesSectionProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groupExpenses");
  const { t: common } = useTranslation("common");

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: theme.muted }]}>
          {t("sectionTitle")}
        </ThemedText>
        {loading || error ? null : (
          <ThemedText style={[styles.sectionCount, { color: theme.muted }]}>
            {t("sectionCount", { count: expenses.length })}
          </ThemedText>
        )}
      </View>

      {loading ? (
        <LoadingState variant="inline" message={t("loading")} />
      ) : error ? (
        <ErrorState
          variant="inline"
          message={error}
          retryLabel={common("actions.retry")}
          retryAccessibilityLabel={t("retryAccessibility")}
          onRetry={onRetry}
        />
      ) : expenses.length === 0 ? (
        <EmptyState
          variant="card"
          title={t("emptyTitle")}
          message={t("emptyMessage")}
        />
      ) : (
        <View style={styles.list}>
          {expenses.map((expense) => (
            <GroupExpenseRow
              key={expense.id}
              expense={expense}
              members={members}
              viewerUid={viewerUid}
              onPress={onOpenExpense}
            />
          ))}
        </View>
      )}
    </View>
  );
}
