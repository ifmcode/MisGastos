import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { centsToAmount } from "@/features/friends/utils/friend-balance";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { DetailView } from "@/shared/components/organisms/detail-view";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useDetailActions } from "@/shared/hooks/use-detail-actions";
import { useDetailCloseNavigation } from "@/shared/hooks/use-detail-close-navigation";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useSettlementDetailScreen } from "../hooks/use-settlement-detail-screen";
import { useSettlementDetailView } from "../hooks/use-settlement-detail-view";
import { settlementsStyles as styles } from "../styles/settlements.styles";
import { SettlementDetailWallet } from "./settlement-detail-wallet";
import { SettlementEditorModal } from "./settlement-editor-modal";
import { SettlementRouteHeader } from "./settlement-route-header";

export interface SettlementDetailScreenProps {
  /** Route id, already normalized to a single trimmed string. */
  settlementId: string;
  /** Actor carried by the notification; only the fallback without history. */
  friendUid?: string;
}

/** Read-only settlement with edit/delete and the creditor's wallet follow-up. */
export function SettlementDetailScreen({
  settlementId,
  friendUid,
}: SettlementDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const locale = useAppLocale();
  const { t, tr } = useScopedTranslation(["settlements", "common"]);
  const screen = useSettlementDetailScreen({ settlementId });
  const { settlement, detail, friendName } = screen;
  const amount = settlement
    ? locale.formatCurrency(
        centsToAmount(settlement.amountCents),
        settlement.currency,
      )
    : "";
  const parentFriendUid = detail?.friendUid ?? friendUid ?? null;
  const leave = useDetailCloseNavigation({ friendUid: parentFriendUid });

  const view = useSettlementDetailView({
    settlement,
    viewerUid: screen.viewerUid,
    viewerName: screen.viewerName,
    friendName,
    walletName: screen.walletInfo.name,
    walletArchived: screen.walletInfo.archived,
    amount,
    pending: screen.pending,
    locale,
    tr,
  });
  const actions = useDetailActions({
    deleteConfirmation: view.deleteConfirmation,
    onConfirmDelete: () => screen.deletion.deleteSettlement(settlement),
    onClose: leave,
  });
  const title = t("detail.title");

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {screen.status === "loading" ? (
        <>
          <SettlementRouteHeader title={title} onBack={leave} />
          <LoadingState message={t("loading")} />
        </>
      ) : screen.status === "error" ? (
        <>
          <SettlementRouteHeader title={title} onBack={leave} />
          <ErrorState
            title={t("detail.errorTitle")}
            message={screen.error ?? ""}
            retryLabel={tr("common:actions.retry")}
            retryAccessibilityLabel={t("retryAccessibility")}
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
          missing={!detail || !settlement}
          disabled={screen.pending}
          labels={view.labels}
          missingLabels={view.missingLabels}
          errorContent={<ErrorBanner message={screen.mutationError} />}
          highlightContent={
            detail ? (
              <SettlementDetailWallet
                detail={detail}
                walletName={screen.walletInfo.name}
                walletArchived={screen.walletInfo.archived}
                pending={screen.pending}
                onLink={screen.editor.open}
                onUnlink={screen.walletLink.requestUnlink}
              />
            ) : null
          }
          onEdit={() => {
            if (screen.friend) screen.editor.open();
          }}
          onDelete={actions.requestDelete}
          onClose={actions.closeDetail}
        />
      )}

      <SettlementEditorModal
        editor={screen.editor}
        friendName={friendName}
        wallets={screen.friendWallets}
        categories={screen.categories}
      />

      <ConfirmDialog
        visible={actions.confirm.visible}
        title={actions.confirm.title}
        message={actions.confirm.message}
        confirmLabel={actions.confirm.confirmLabel}
        cancelLabel={actions.confirm.cancelLabel}
        onConfirm={actions.confirm.confirm}
        onCancel={actions.confirm.close}
      />

      <ConfirmDialog
        visible={screen.walletLink.confirm.visible}
        title={screen.walletLink.confirm.title}
        message={screen.walletLink.confirm.message}
        confirmLabel={screen.walletLink.confirm.confirmLabel}
        cancelLabel={screen.walletLink.confirm.cancelLabel}
        onConfirm={screen.walletLink.confirm.confirm}
        onCancel={screen.walletLink.confirm.close}
      />
    </ThemedView>
  );
}
