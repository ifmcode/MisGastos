import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { Friend } from "@/features/friends/types/friend.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";

import { useSharedExpensesSection } from "../hooks/use-shared-expenses-section";
import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";
import { SharedExpensesList } from "./shared-expenses-list";
import { SharedExpensesSectionHeader } from "./shared-expenses-section-header";
import { SharedExpenseFormModal } from "./shared-expense-form-modal";

export interface SharedExpensesSectionProps {
  friends: readonly Friend[];
  preferredCurrency: CurrencyCode;
  /** Reloads the friends balances after a create, edit or delete. */
  onBalancesChanged: () => void;
  /** Pull-to-refresh state of the parent screen, so the list reloads with it. */
  refreshing: boolean;
}

/** Shared-expenses section mounted at the end of the friends tab. */
export function SharedExpensesSection({
  friends,
  preferredCurrency,
  onBalancesChanged,
  refreshing,
}: SharedExpensesSectionProps) {
  const { t } = useTranslation(["sharedExpenses", "common"]);
  const section = useSharedExpensesSection({
    friends,
    preferredCurrency,
    onBalancesChanged,
    refreshing,
  });
  const { editor } = section;
  const hasFriends = friends.length > 0;

  return (
    <View style={styles.section}>
      <SharedExpensesSectionHeader
        disabled={!hasFriends}
        onAdd={editor.openCreate}
      />

      {!hasFriends ? (
        <EmptyState
          variant="card"
          title={t("empty.noFriendsTitle")}
          message={t("empty.noFriendsMessage")}
        />
      ) : section.loading ? (
        <LoadingState variant="inline" message={t("loading")} />
      ) : section.error ? (
        <ErrorState
          variant="inline"
          message={section.error}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("retryAccessibility")}
          onRetry={section.reload}
        />
      ) : (
        <>
          <ErrorBanner message={section.actionError} />
          <SharedExpensesList
            friends={friends}
            expenses={section.expenses}
            viewerUid={section.viewerUid ?? ""}
            pendingId={section.pendingId}
            onEdit={editor.openEdit}
            onDelete={section.requestDelete}
          />
        </>
      )}

      <SharedExpenseFormModal
        visible={editor.formVisible}
        friends={friends}
        initialValues={editor.initialValues}
        fieldErrors={editor.fieldErrors}
        error={editor.formError}
        submitting={editor.submitting}
        isEditing={editor.editingExpense !== null}
        onSubmit={editor.submit}
        onCancel={editor.closeForm}
      />

      <ConfirmDialog
        visible={section.confirm.visible}
        title={section.confirm.title}
        message={section.confirm.message}
        confirmLabel={section.confirm.confirmLabel}
        cancelLabel={section.confirm.cancelLabel}
        onConfirm={section.confirm.confirm}
        onCancel={section.confirm.close}
      />
    </View>
  );
}
