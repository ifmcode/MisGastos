import { ScrollView, View } from "react-native";

import type { CurrencyCode } from "@/shared/constants/currencies";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { settlementsStyles as styles } from "../styles/settlements.styles";
import type { SettlementCurrencyOption } from "../utils/settlement-form";
import { SettlementDebtOption } from "./settlement-debt-option";
import { SettlementRouteHeader } from "./settlement-route-header";

export interface SettlementDebtStepProps {
  friendName: string;
  /** Currencies with a real debt of the pair, in `Friend.balances[]` order. */
  options: readonly SettlementCurrencyOption[];
  /** Opens the settlement form locked to the chosen currency. */
  onSelect: (currency: CurrencyCode) => void;
  onBack: () => void;
}

/**
 * Debt currency picker shown before the form when the pair owes money in two
 * or more currencies. In a single-currency pair the step is skipped.
 */
export function SettlementDebtStep({
  friendName,
  options,
  onSelect,
  onBack,
}: SettlementDebtStepProps) {
  const { t } = useScopedTranslation("settlements");

  return (
    <>
      <SettlementRouteHeader
        title={t("form.debtStep.title")}
        subtitle={t("form.debtStep.subtitle", { name: friendName })}
        onBack={onBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          accessibilityRole="list"
          accessibilityLabel={t("form.debtStep.listAccessibility")}
          style={styles.debtStepList}
        >
          {options.map((option) => (
            <SettlementDebtOption
              key={option.currency}
              option={option}
              onSelect={() => onSelect(option.currency)}
            />
          ))}
        </View>
      </ScrollView>
    </>
  );
}
