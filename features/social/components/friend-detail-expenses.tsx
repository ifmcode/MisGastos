import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Friend } from "@/features/friends/types/friend.types";
import { FriendSharedExpensesList } from "@/features/shared-expenses/components/friend-shared-expenses-list";
import type { SharedExpense } from "@/features/shared-expenses/types/shared-expense.types";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { friendDetailStyles as styles } from "../styles/friend-detail.styles";

export interface FriendDetailExpensesProps {
  expenses: readonly SharedExpense[];
  friends: readonly Friend[];
  viewerUid: string;
  loading: boolean;
  error: string | null;
  /** Id of the expense with an operation in flight, if any. */
  pendingId: string | null;
  onRetry: () => void;
  onEdit: (expense: SharedExpense) => void;
  onDelete: (expense: SharedExpense) => void;
}

/**
 * Section title plus the pair expenses. Loading and the retry error only take
 * the whole section while there is nothing to show; otherwise the list stays
 * visible and the failure is announced in a banner.
 */
export function FriendDetailExpenses({
  expenses,
  friends,
  viewerUid,
  loading,
  error,
  pendingId,
  onRetry,
  onEdit,
  onDelete,
}: FriendDetailExpensesProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["sharedExpenses", "social", "common"]);
  const empty = expenses.length === 0;

  return (
    <View style={styles.section}>
      <ThemedText
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: theme.muted }]}
      >
        {t("sharedExpenses:title")}
      </ThemedText>

      {loading && empty ? (
        <LoadingState variant="inline" message={t("sharedExpenses:loading")} />
      ) : error && empty ? (
        <ErrorState
          variant="inline"
          message={error}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("sharedExpenses:retryAccessibility")}
          onRetry={onRetry}
        />
      ) : (
        <>
          <ErrorBanner message={error} />
          <FriendSharedExpensesList
            expenses={expenses}
            friends={friends}
            viewerUid={viewerUid}
            pendingId={pendingId}
            emptyTitle={t("social:friendDetail.emptyTitle")}
            emptyMessage={t("social:friendDetail.emptyMessage")}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </>
      )}
    </View>
  );
}
