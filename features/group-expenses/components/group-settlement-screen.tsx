import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { SocialRouteHeader } from "@/features/social/components/social-route-header";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import {
  useGroupSettlementScreen,
  type UseGroupSettlementScreenOptions,
} from "../hooks/use-group-settlement-screen";
import { groupSettlementsStyles as styles } from "../styles/group-settlements.styles";
import { GroupSettlementDebtStep } from "./group-settlement-debt-step";
import { GroupSettlementForm } from "./group-settlement-form";

export type GroupSettlementScreenProps = UseGroupSettlementScreenOptions;

/**
 * Settlement route in create, select and edit mode. Without a pair it shows the
 * debt step; with a pair it resolves the debt and mounts the form. It falls back
 * to a safe empty state when there is no debt left or the record is gone.
 */
export function GroupSettlementScreen(props: GroupSettlementScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useScopedTranslation(["groupExpenses", "common"]);
  const screen = useGroupSettlementScreen(props);
  const title = screen.isEditing
    ? t("settlementForm.editTitle")
    : t("settlementForm.createTitle");
  const subtitle = screen.isEditing
    ? screen.groupName
      ? t("settlementForm.editSubtitle", { group: screen.groupName })
      : undefined
    : screen.fromName && screen.toName
      ? t("settlementForm.subtitle", {
          from: screen.fromName,
          to: screen.toName,
        })
      : undefined;
  const ready = Boolean(
    screen.status === "ready" &&
      screen.initialValues &&
      screen.debt &&
      screen.direction,
  );
  const emptyCopy =
    screen.status === "no-debt"
      ? {
          title: t("settlementForm.noDebtTitle"),
          message: t("settlementForm.noDebtMessage"),
        }
      : screen.isEditing
        ? {
            title: t("settlementForm.goneTitle"),
            message: t("settlementForm.goneMessage"),
          }
        : {
            title: t("settlementForm.groupMissingTitle"),
            message: t("settlementForm.groupMissingMessage"),
          };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {screen.status === "select" ? (
        <GroupSettlementDebtStep
          debts={screen.debts}
          members={screen.detail?.members ?? []}
          viewerUid={screen.viewerUid}
          simplifyDebts={screen.simplifyDebts}
          onBack={screen.leave}
          onSelect={screen.selectDebt}
        />
      ) : (
        <>
          <SocialRouteHeader
            title={title}
            subtitle={subtitle}
            onBack={screen.leave}
          />

          {screen.status === "loading" ? (
            <LoadingState message={t("settlementForm.loading")} />
          ) : screen.status === "error" ? (
            <ErrorState
              title={t("settlementForm.errorTitle")}
              message={screen.error ?? ""}
              retryLabel={t("common:actions.retry")}
              retryAccessibilityLabel={t("settlementForm.retryAccessibility")}
              onRetry={screen.reload}
            />
          ) : !ready ||
            !screen.initialValues ||
            !screen.debt ||
            !screen.direction ? (
            <EmptyState
              icon="checkmark-done-outline"
              title={emptyCopy.title}
              message={emptyCopy.message}
              primaryAction={{
                label: t("settlementForm.back"),
                accessibilityLabel: t("settlementForm.backAccessibility"),
                onPress: screen.leave,
              }}
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <GroupSettlementForm
                key={`${screen.settlement?.id ?? "new"}|${screen.debt.fromUserId}|${screen.debt.toUserId}|${screen.debt.currency}`}
                initialValues={screen.initialValues}
                debtCents={screen.boundCents}
                viewerIsCreditor={screen.viewerIsCreditor}
                amountLocked={screen.amountLocked}
                direction={screen.direction}
                groupName={screen.groupName}
                fromName={screen.fromName}
                toName={screen.toName}
                wallets={screen.wallets}
                categories={screen.categories}
                fieldErrors={screen.fieldErrors}
                error={screen.formError}
                submitting={screen.submitting}
                isEditing={screen.isEditing}
                onSubmit={screen.submit}
                onCancel={screen.leave}
              />
            </ScrollView>
          )}
        </>
      )}
    </ThemedView>
  );
}
