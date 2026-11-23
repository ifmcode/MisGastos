import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { GroupMember } from "@/features/groups/types/group.types";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { SettleButton } from "@/shared/components/molecules/settle-button";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupExpensesStyles } from "../styles/group-expenses.styles";
import type { GroupBalances } from "../types/group-balance.types";
import { GroupMemberBalanceList } from "./group-member-balance-list";

export interface GroupBalancesSectionProps {
  balances: GroupBalances | null;
  members: readonly GroupMember[];
  viewerUid: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Opens the debt step of the settle route; the list lives there now. */
  onOpenSettle: () => void;
}

/**
 * Balances of one group: the raw per-member list plus **Liquidar deudas**. The
 * section is hidden when the group has no pending debt (the header keeps "En
 * paz"), and the former viewer summary line above the breakdown was removed.
 */
export function GroupBalancesSection({
  balances,
  members,
  viewerUid,
  loading,
  error,
  onRetry,
  onOpenSettle,
}: GroupBalancesSectionProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const { t: common } = useTranslation("common");

  const settled =
    balances !== null &&
    balances.currencies.length === 0 &&
    balances.debts.length === 0;

  // Nothing pending: no section at all, only the header's "En paz".
  if (settled) return null;

  return (
    <View style={groupExpensesStyles.section}>
      <ThemedText
        accessibilityRole="header"
        accessibilityHint={t("balancesHint")}
        style={[groupExpensesStyles.sectionTitle, { color: theme.muted }]}
      >
        {t("balancesTitle")}
      </ThemedText>

      {loading && !balances ? (
        <LoadingState variant="inline" message={t("balancesLoading")} />
      ) : error && !balances ? (
        <ErrorState
          variant="inline"
          message={error}
          retryLabel={common("actions.retry")}
          retryAccessibilityLabel={t("balancesRetryAccessibility")}
          onRetry={onRetry}
        />
      ) : balances ? (
        <>
          <ErrorBanner message={error} />

          <GroupMemberBalanceList
            currencies={balances.currencies}
            members={members}
            viewerUid={viewerUid}
          />

          <SettleButton
            label={t("balances.settle")}
            accessibilityLabel={t("balances.settleAccessibility")}
            accessibilityHint={t("balances.settleHint")}
            onPress={onOpenSettle}
          />
        </>
      ) : null}
    </View>
  );
}
