import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupSettlementsStyles as styles } from "../styles/group-settlements.styles";
import type { GroupSettlementDirection } from "../utils/group-settlement-form.types";

export interface GroupSettlementDebtCardProps {
  groupName: string;
  /** Display name of the debtor (payer) of the pair. */
  fromName: string;
  /** Display name of the creditor (receiver) of the pair. */
  toName: string;
  /** Already formatted currency (`EUR €`); the form has no selector. */
  currencyLabel: string;
  /** Already formatted debt of the pair. */
  amount: string;
  direction: GroupSettlementDirection;
}

/** Group, fixed pair, currency and outstanding debt of the settlement. */
export function GroupSettlementDebtCard({
  groupName,
  fromName,
  toName,
  currencyLabel,
  amount,
  direction,
}: GroupSettlementDebtCardProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groupExpenses");
  const viewerReceives = direction === "viewer-receives";

  return (
    <View
      style={[
        styles.debtCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <ThemedText style={[styles.debtLabel, { color: theme.muted }]}>
        {t("settlementForm.groupLabel")}
      </ThemedText>
      <ThemedText style={[styles.debtGroup, { color: theme.text }]}>
        {groupName}
      </ThemedText>
      <ThemedText
        style={[styles.debtPair, { color: theme.text }]}
        numberOfLines={2}
      >
        {t("settlementForm.pair", { from: fromName, to: toName })}
      </ThemedText>
      <ThemedText style={[styles.debtLabel, { color: theme.muted }]}>
        {currencyLabel} · {t("settlementForm.outstanding", { amount })}
      </ThemedText>
      <ThemedText
        style={[
          styles.debtDirection,
          { color: viewerReceives ? theme.success : theme.danger },
        ]}
      >
        {viewerReceives
          ? t("settlementForm.youReceive")
          : t("settlementForm.youPay")}
      </ThemedText>
    </View>
  );
}
