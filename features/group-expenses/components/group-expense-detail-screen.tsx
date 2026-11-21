import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { SocialRouteHeader } from "@/features/social/components/social-route-header";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { DetailView } from "@/shared/components/organisms/detail-view";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useDetailActions } from "@/shared/hooks/use-detail-actions";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useGroupExpenseCloseNavigation } from "../hooks/use-group-expense-close-navigation";
import { useGroupExpenseDetailScreen } from "../hooks/use-group-expense-detail-screen";
import { useGroupExpenseDetailView } from "../hooks/use-group-expense-detail-view";
import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";
import {
  getGroupExpenseDetailActionLabels,
  getGroupExpenseDetailDeleteConfirmation,
  getGroupExpenseDetailMissingLabels,
} from "../utils/group-expense-detail-copy";
import {
  canDeleteGroupExpense,
  canEditGroupExpense,
} from "../utils/group-expense-permissions";
import { GroupExpenseDetailNotice } from "./group-expense-detail-notice";
import { GroupExpenseDetailParticipants } from "./group-expense-detail-participants";
import { GroupExpenseFormModal } from "./group-expense-form-modal";

function readParam(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim();
}

/**
 * Read-only group expense. The record is re-resolved on focus, so an edit from
 * the form or another device shows fresh data and a deletion falls back to the
 * safe missing state. Edit and delete only exist for the owner, creator or payer.
 */
export function GroupExpenseDetailScreen() {
  const insets = useSafeAreaInsets();
  const locale = useAppLocale();
  const { tr } = useScopedTranslation(["groupExpenses", "social", "common"]);
  const params = useLocalSearchParams<{
    expenseId?: string | string[];
    groupId?: string | string[];
  }>();
  const screen = useGroupExpenseDetailScreen({
    expenseId: readParam(params.expenseId),
  });
  const { expense, detail, editor } = screen;

  const leave = useGroupExpenseCloseNavigation({
    groupId: readParam(params.groupId) || expense?.groupId || null,
  });

  const view = useGroupExpenseDetailView({
    expense,
    groupName: detail?.group.name ?? "",
    viewerUid: screen.viewerUid,
    members: detail?.members ?? [],
    locale,
    tr,
  });

  const deletable =
    expense && detail
      ? canDeleteGroupExpense(expense, detail.group, screen.viewerUid)
      : false;
  const editable =
    expense && detail
      ? canEditGroupExpense(expense, detail.group, screen.viewerUid)
      : false;
  const deleteConfirmation =
    expense && deletable
      ? getGroupExpenseDetailDeleteConfirmation(tr, expense.description)
      : null;
  const actions = useDetailActions({
    deleteConfirmation,
    onConfirmDelete: screen.deleteExpense,
    onClose: leave,
  });
  const title = tr("groupExpenses:detail.title");

  return (
    <ThemedView style={[styles.flex, { paddingTop: insets.top }]}>
      {screen.status === "loading" ? (
        <>
          <SocialRouteHeader title={title} onBack={leave} />
          <LoadingState message={tr("groupExpenses:loading")} />
        </>
      ) : screen.status === "error" ? (
        <>
          <SocialRouteHeader title={title} onBack={leave} />
          <ErrorState
            title={tr("groupExpenses:detail.errorTitle")}
            message={screen.error ?? ""}
            retryLabel={tr("common:actions.retry")}
            retryAccessibilityLabel={tr("groupExpenses:retryAccessibility")}
            onRetry={screen.reload}
          />
        </>
      ) : (
        <DetailView
          closeIcon="back"
          title={title}
          subtitle={expense?.description ?? ""}
          summary={view?.summary}
          fields={view?.fields}
          missing={!expense}
          disabled={screen.pending}
          showEdit={editable}
          showDelete={deletable}
          labels={getGroupExpenseDetailActionLabels(tr, {
            description: expense?.description ?? "",
            pending: screen.pending,
          })}
          missingLabels={getGroupExpenseDetailMissingLabels(tr)}
          errorContent={
            <>
              {deletable && !editable ? (
                <GroupExpenseDetailNotice
                  message={tr("groupExpenses:detail.formerMembersNotice")}
                />
              ) : null}
              <ErrorBanner message={screen.mutationError} />
            </>
          }
          onEdit={() => {
            if (expense) editor.openEdit(expense);
          }}
          onDelete={actions.requestDelete}
          onClose={actions.closeDetail}
        >
          {view ? (
            <GroupExpenseDetailParticipants fields={view.participants} />
          ) : null}
        </DetailView>
      )}

      <GroupExpenseFormModal editor={editor} />
      <ConfirmDialog
        visible={actions.confirm.visible}
        title={actions.confirm.title}
        message={actions.confirm.message}
        confirmLabel={actions.confirm.confirmLabel}
        cancelLabel={actions.confirm.cancelLabel}
        onConfirm={actions.confirm.confirm}
        onCancel={actions.confirm.close}
      />
    </ThemedView>
  );
}
