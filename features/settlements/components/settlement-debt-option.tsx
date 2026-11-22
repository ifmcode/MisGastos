import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { formatCurrencyLabel } from "@/shared/utils/currency-label";

import { settlementsStyles as styles } from "../styles/settlements.styles";
import {
  viewerIsCreditorFor,
  type SettlementCurrencyOption,
} from "../utils/settlement-form";

export interface SettlementDebtOptionProps {
  /** Debt currency with its amount and direction. */
  option: SettlementCurrencyOption;
  /** Opens the settlement form locked to this currency. */
  onSelect: () => void;
}

/** One debt currency: code + symbol, outstanding amount and who pays. */
export function SettlementDebtOption({
  option,
  onSelect,
}: SettlementDebtOptionProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("settlements");
  const { formatCurrency } = useAppLocale();
  const viewerIsCreditor = viewerIsCreditorFor(option);
  const amount = formatCurrency(option.debtCents / 100, option.currency);
  const direction = viewerIsCreditor
    ? t("direction.friendPays")
    : t("direction.youPay");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("form.debtStep.rowAccessibility", {
        amount,
        currency: option.currency,
        direction,
      })}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.debtOption,
        { borderColor: theme.border, backgroundColor: theme.surface },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.debtOptionBody}>
        <ThemedText style={[styles.debtOptionCurrency, { color: theme.muted }]}>
          {formatCurrencyLabel(option.currency)}
        </ThemedText>
        <ThemedText style={styles.debtOptionAmount}>{amount}</ThemedText>
        <ThemedText
          style={[
            styles.debtOptionDirection,
            { color: viewerIsCreditor ? theme.success : theme.danger },
          ]}
        >
          {direction}
        </ThemedText>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.muted}
        accessible={false}
      />
    </Pressable>
  );
}
