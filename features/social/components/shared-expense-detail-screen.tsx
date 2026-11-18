import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { SharedExpenseEditorModal } from "@/features/shared-expenses/components/shared-expense-editor-modal";
import { SharedExpenseParticipants } from "@/features/shared-expenses/components/shared-expense-participants";
import { SharedExpenseWalletWarning } from "@/features/shared-expenses/components/shared-expense-wallet-warning";
import { hasViewerPaidWithoutWallet } from "@/features/shared-expenses/utils/shared-expense-wallet-warning";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { DetailView } from "@/shared/components/organisms/detail-view";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useDetailActions } from "@/shared/hooks/use-detail-actions";
import { useDetailCloseNavigation } from "@/shared/hooks/use-detail-close-navigation";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useSharedExpenseDetailScreen } from "../hooks/use-shared-expense-detail-screen";
import { useSharedExpenseDetailView } from "../hooks/use-shared-expense-detail-view";
import { sharedExpenseDetailStyles as styles } from "../styles/shared-expense-detail.styles";
import { SocialRouteHeader } from "./social-route-header";
import {
  getSharedExpenseDetailActionLabels,
  getSharedExpenseDetailDeleteConfirmation,
  getSharedExpenseDetailMissingLabels,
} from "../utils/shared-expense-detail-copy";

function readParam(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim();
}

/**
 * Read-only shared expense. The record is re-resolved from the live list on
 * every render, so an edit elsewhere or the form closing after a save shows
 * fresh data, and a deletion falls back to the safe missing state.
 */
export function SharedExpenseDetailScreen() {
  const insets = useSafeAreaInsets();
  const locale = useAppLocale();
  const { tr } = useScopedTranslation(["sharedExpenses", "social", "common"]);
  const params = useLocalSearchParams<{
    expenseId?: string | string[];
    from?: string | string[];
    friendUid?: string | string[];
  }>();
  const screen = useSharedExpenseDetailScreen({
    expenseId: readParam(params.expenseId),
  });
  const { expense, editor } = screen;
  const fromNotification = readParam(params.from) === "notification";
  const walletWarningVisible = expense
    ? hasViewerPaidWithoutWallet(expense, screen.viewerUid)
    : false;

  const leave = useDetailCloseNavigation({
    fromNotification,
    friendUid: readParam(params.friendUid) || null,
  });

  const detail = useSharedExpenseDetailView({
    expense,
    viewerUid: screen.viewerUid,
    friends: screen.friends,
    linkedMovement: screen.linkedMovement,
    locale,
    tr,
  });

  const deleteConfirmation = expense
    ? getSharedExpenseDetailDeleteConfirmation(tr, expense.description)
    : null;
  const actions = useDetailActions({
    deleteConfirmation,
    onConfirmDelete: screen.deleteExpense,
    onClose: leave,
  });
  const title = tr("sharedExpenses:detail.title");

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {screen.status === "loading" ? (
        <>
          <SocialRouteHeader title={title} onBack={leave} />
          <LoadingState message={tr("sharedExpenses:loading")} />
        </>
      ) : screen.status === "error" ? (
        <>
          <SocialRouteHeader title={title} onBack={leave} />
          <ErrorState
            title={tr("sharedExpenses:detail.errorTitle")}
            message={screen.error ?? ""}
            retryLabel={tr("common:actions.retry")}
            retryAccessibilityLabel={tr("sharedExpenses:retryAccessibility")}
            onRetry={screen.reload}
          />
        </>
      ) : (
        <DetailView
          closeIcon="back"
          title={title}
          subtitle={expense?.description ?? ""}
          summary={detail?.summary}
          fields={detail?.fields}
          missing={!expense}
          disabled={screen.pending}
          labels={getSharedExpenseDetailActionLabels(tr, {
            description: expense?.description ?? "",
            pending: screen.pending,
          })}
          missingLabels={getSharedExpenseDetailMissingLabels(tr)}
          errorContent={
            <>
              <ErrorBanner message={screen.mutationError} />
              {walletWarningVisible ? <SharedExpenseWalletWarning /> : null}
            </>
          }
          onEdit={() => {
            if (expense) editor.openEdit(expense);
          }}
          onDelete={actions.requestDelete}
          onClose={actions.closeDetail}
        >
          {detail ? (
            <SharedExpenseParticipants fields={detail.participants} />
          ) : null}
        </DetailView>
      )}

      <SharedExpenseEditorModal editor={editor} friends={screen.friends} />
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
