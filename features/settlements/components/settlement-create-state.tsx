import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { SettlementCreateStatus } from "../hooks/settlement-create-screen.types";
import { SettlementRouteHeader } from "./settlement-route-header";

export interface SettlementCreateStateProps {
  /** Only `loading`, `error`, `missing` and `empty` reach this component. */
  status: SettlementCreateStatus;
  friendName: string;
  /** The step was shown before and the pair no longer owes anything. */
  debtDisappeared: boolean;
  error: string | null;
  onBack: () => void;
  onRetry: () => void;
}

/** Header plus the loading, error and empty feedback of the create route. */
export function SettlementCreateState({
  status,
  friendName,
  debtDisappeared,
  error,
  onBack,
  onRetry,
}: SettlementCreateStateProps) {
  const { t } = useScopedTranslation(["settlements", "common"]);

  const emptyTitle = debtDisappeared
    ? t("form.debtStep.empty")
    : status === "missing"
      ? t("errors.FRIEND_NOT_FOUND")
      : t("form.missingTitle");
  const emptyMessage = debtDisappeared
    ? t("form.debtStep.emptyMessage")
    : t("form.missingMessage");

  return (
    <>
      <SettlementRouteHeader
        title={t("form.createTitle")}
        subtitle={
          friendName ? t("form.subtitle", { name: friendName }) : undefined
        }
        onBack={onBack}
      />

      {status === "loading" ? (
        <LoadingState message={t("form.loading")} />
      ) : status === "error" ? (
        <ErrorState
          title={t("form.errorTitle")}
          message={error ?? ""}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("form.retryAccessibility")}
          onRetry={onRetry}
        />
      ) : (
        <EmptyState
          icon="checkmark-done-outline"
          title={emptyTitle}
          message={emptyMessage}
          primaryAction={{
            label: t("form.back"),
            accessibilityLabel: t("form.backAccessibility"),
            onPress: onBack,
          }}
        />
      )}
    </>
  );
}
