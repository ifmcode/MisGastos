import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { centsToAmount } from "@/features/friends/utils/friend-balance";
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
import { useGroupSettlementDetailScreen } from "../hooks/use-group-settlement-detail-screen";
import { useGroupSettlementDetailView } from "../hooks/use-group-settlement-detail-view";
import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";

export interface GroupSettlementDetailScreenProps {
  /** Route id, already normalized to a single trimmed string. */
  settlementId: string;
}

/**
 * Read-only group settlement. The record is re-resolved on focus, so an edit
 * saved on the settle route is visible on return and a deletion falls back to
 * the safe missing state. Edit and delete only exist for the two pair members,
 * because the rules deny every other viewer.
 */
export function GroupSettlementDetailScreen({
  settlementId,
}: GroupSettlementDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const locale = useAppLocale();
  const { tr } = useScopedTranslation(["groupExpenses", "common", "social"]);
  const screen = useGroupSettlementDetailScreen({ settlementId });
  const { settlement } = screen;
  const leave = useGroupExpenseCloseNavigation({
    groupId: settlement?.groupId ?? null,
  });
  const amount = settlement
    ? locale.formatCurrency(
        centsToAmount(settlement.amountCents),
        settlement.currency,
      )
    : "";
  const view = useGroupSettlementDetailView({
    settlement,
    members: screen.detail?.members ?? [],
    groupName: screen.detail?.group.name ?? "",
    viewerUid: screen.viewerUid,
    walletName: screen.walletName,
    walletArchived: screen.walletArchived,
    amount,
    pending: screen.pending,
    locale,
    tr,
  });
  const actions = useDetailActions({
    deleteConfirmation: screen.isParticipant ? view.deleteConfirmation : null,
    onConfirmDelete: screen.deleteSettlement,
    onClose: leave,
  });
  const openEdit = useCallback(() => {
    if (!settlement) return;

    router.push(
      `/social/groups/${encodeURIComponent(settlement.groupId)}/settle?settlementId=${encodeURIComponent(settlement.id)}` as Href,
    );
  }, [router, settlement]);
  const title = tr("groupExpenses:settlementDetail.title");

  return (
    <ThemedView style={[styles.flex, { paddingTop: insets.top }]}>
      {screen.status === "loading" ? (
        <>
          <SocialRouteHeader title={title} onBack={leave} />
          <LoadingState message={tr("groupExpenses:settlementDetail.loading")} />
        </>
      ) : screen.status === "error" ? (
        <>
          <SocialRouteHeader title={title} onBack={leave} />
          <ErrorState
            title={tr("groupExpenses:settlementDetail.errorTitle")}
            message={screen.error ?? ""}
            retryLabel={tr("common:actions.retry")}
            retryAccessibilityLabel={tr(
              "groupExpenses:settlementDetail.retryAccessibility",
            )}
            onRetry={screen.reload}
          />
        </>
      ) : (
        <DetailView
          closeIcon="back"
          title={title}
          subtitle={view.subtitle}
          summary={view.summary}
          fields={view.fields}
          missing={!settlement}
          disabled={screen.pending}
          showEdit={screen.isParticipant}
          showDelete={screen.isParticipant}
          labels={view.labels}
          missingLabels={view.missingLabels}
          errorContent={<ErrorBanner message={screen.mutationError} />}
          onEdit={openEdit}
          onDelete={actions.requestDelete}
          onClose={actions.closeDetail}
        />
      )}

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
