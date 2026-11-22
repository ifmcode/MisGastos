import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { settlementsStyles as styles } from "../styles/settlements.styles";

export interface SettlementFormDebtCardProps {
  /** Already formatted debt currency (`EUR €`); the form has no selector. */
  currencyLabel: string;
  /** Already formatted debt of the selected currency. */
  amount: string;
  viewerIsCreditor: boolean;
}

/** Debt currency, outstanding amount and fixed direction of the settlement. */
export function SettlementFormDebtCard({
  currencyLabel,
  amount,
  viewerIsCreditor,
}: SettlementFormDebtCardProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("settlements");

  return (
    <View
      style={[
        styles.debtCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <ThemedText style={[styles.debtLabel, { color: theme.muted }]}>
        {currencyLabel}
      </ThemedText>
      <ThemedText style={[styles.debtLabel, { color: theme.muted }]}>
        {t("form.outstanding", { amount })}
      </ThemedText>
      <ThemedText
        style={[
          styles.debtDirection,
          { color: viewerIsCreditor ? theme.success : theme.danger },
        ]}
      >
        {viewerIsCreditor ? t("direction.friendPays") : t("direction.youPay")}
      </ThemedText>
    </View>
  );
}
