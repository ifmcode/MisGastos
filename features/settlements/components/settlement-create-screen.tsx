import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";

import { useSettlementCreateScreen } from "../hooks/use-settlement-create-screen";
import { settlementsStyles as styles } from "../styles/settlements.styles";
import { viewerIsCreditorFor } from "../utils/settlement-form";
import { SettlementCreateState } from "./settlement-create-state";
import { SettlementDebtStep } from "./settlement-debt-step";
import { SettlementForm } from "./settlement-form";

export interface SettlementCreateScreenProps {
  /** Route friend uid, already normalized to a single trimmed string. */
  friendUid: string;
  /** Optional `currency` route param, already normalized; empty when absent. */
  currency: string;
}

/**
 * Create route: loads the pair debt, decides between the debt-selection step
 * and the shared settlement form, and never settles a defaulted currency.
 */
export function SettlementCreateScreen({
  friendUid,
  currency,
}: SettlementCreateScreenProps) {
  const insets = useSafeAreaInsets();
  const screen = useSettlementCreateScreen({ friendUid, currency });
  const { status, friendName, options, selectedOption, initialValues } = screen;

  if (status === "ready" && initialValues && selectedOption) {
    return (
      <ThemedView style={styles.container}>
        <SettlementForm
          initialValues={initialValues}
          options={options}
          friendName={friendName}
          debtCents={selectedOption.debtCents}
          viewerIsCreditor={viewerIsCreditorFor(selectedOption)}
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
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {status === "select" ? (
        <SettlementDebtStep
          friendName={friendName}
          options={options}
          onSelect={screen.selectCurrency}
          onBack={screen.leave}
        />
      ) : (
        <SettlementCreateState
          status={status}
          friendName={friendName}
          debtDisappeared={screen.debtDisappeared}
          error={screen.error}
          onBack={screen.leave}
          onRetry={screen.reload}
        />
      )}
    </ThemedView>
  );
}
