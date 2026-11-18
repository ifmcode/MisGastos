import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

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
  onRetry: () => void;
  onOpen: (expense: SharedExpense) => void;
  /** True when a full settlement hides the previous expenses. */
  collapsed: boolean;
  canCollapse: boolean;
  onToggle: () => void;
}

/**
 * Section title plus the pair expenses. A full settlement collapses the list
 * behind "Show previous expenses" instead of deleting history, and the section
 * is never hidden while the pair still owes money.
 */
export function FriendDetailExpenses({
  expenses,
  friends,
  viewerUid,
  loading,
  error,
  onRetry,
  onOpen,
  collapsed,
  canCollapse,
  onToggle,
}: FriendDetailExpensesProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["sharedExpenses", "social", "common", "settlements"]);
  const empty = expenses.length === 0;

  return (
    <View style={styles.section}>
      <ThemedText
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: theme.muted }]}
      >
        {t("sharedExpenses:title")}
      </ThemedText>

      {collapsed ? (
        <>
          <View
            style={[
              styles.settledNotice,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          >
            <ThemedText style={[styles.settledTitle, { color: theme.success }]}>
              {t("settlements:expenses.settledTitle")}
            </ThemedText>
            <ThemedText style={[styles.settledMessage, { color: theme.muted }]}>
              {t("settlements:expenses.settledMessage")}
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("settlements:expenses.showPrevious")}
            accessibilityHint={t("settlements:expenses.showPreviousHint")}
            onPress={onToggle}
            style={({ pressed }) => [
              styles.toggleButton,
              { borderColor: theme.primary },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText style={[styles.toggleButtonText, { color: theme.primary }]}>
              {t("settlements:expenses.showPrevious")}
            </ThemedText>
          </Pressable>
        </>
      ) : loading && empty ? (
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
            emptyTitle={t("social:friendDetail.emptyTitle")}
            emptyMessage={t("social:friendDetail.emptyMessage")}
            onOpen={onOpen}
          />
          {canCollapse ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("settlements:expenses.hidePrevious")}
              accessibilityHint={t("settlements:expenses.hidePreviousHint")}
              onPress={onToggle}
              style={({ pressed }) => [
                styles.toggleButton,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText style={[styles.toggleButtonText, { color: theme.text }]}>
                {t("settlements:expenses.hidePrevious")}
              </ThemedText>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}
