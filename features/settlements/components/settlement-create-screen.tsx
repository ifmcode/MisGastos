import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useSettlementCreateScreen } from "../hooks/use-settlement-create-screen";
import { settlementsStyles as styles } from "../styles/settlements.styles";
import { SettlementForm } from "./settlement-form";
import { SettlementRouteHeader } from "./settlement-route-header";

export interface SettlementCreateScreenProps {
  /** Route friend uid, already normalized to a single trimmed string. */
  friendUid: string;
}

/** Create route: loads the pair debt and opens the shared settlement form. */
export function SettlementCreateScreen({ friendUid }: SettlementCreateScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useScopedTranslation(["settlements", "common"]);
  const screen = useSettlementCreateScreen({ friendUid });
  const { initialValues, friendName, options } = screen;
  const fallback = options[0];

  return (
    <ThemedView
      style={[
        styles.container,
        screen.status === "ready" ? null : { paddingTop: insets.top + 16 },
      ]}
    >
      {screen.status === "ready" && initialValues && friendName ? (
        <SettlementForm
          initialValues={initialValues}
          options={options}
          friendName={friendName}
          debtCents={fallback?.debtCents ?? 0}
          viewerIsCreditor={fallback?.direction === "friend-owes-viewer"}
          wallets={screen.wallets}
          categories={screen.categories}
          fieldErrors={screen.fieldErrors}
          error={screen.formError}
          submitting={screen.submitting}
          isEditing={false}
          amountLocked={false}
          onSubmit={screen.submit}
          onCancel={screen.leave}
        />
      ) : (
        <>
          <SettlementRouteHeader
            title={t("form.createTitle")}
            subtitle={
              friendName ? t("form.subtitle", { name: friendName }) : undefined
            }
            onBack={screen.leave}
          />

          {screen.status === "loading" ? (
            <LoadingState message={t("form.loading")} />
          ) : screen.status === "error" ? (
            <ErrorState
              title={t("form.errorTitle")}
              message={screen.error ?? ""}
              retryLabel={t("common:actions.retry")}
              retryAccessibilityLabel={t("form.retryAccessibility")}
              onRetry={screen.reload}
            />
          ) : (
            <EmptyState
              icon="checkmark-done-outline"
              title={
                screen.status === "missing"
                  ? t("errors.FRIEND_NOT_FOUND")
                  : t("form.missingTitle")
              }
              message={t("form.missingMessage")}
              primaryAction={{
                label: t("form.back"),
                accessibilityLabel: t("form.backAccessibility"),
                onPress: screen.leave,
              }}
            />
          )}
        </>
      )}
    </ThemedView>
  );
}
