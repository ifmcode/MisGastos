import { useMemo } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  CurrencyChipSelector,
  type CurrencyOption,
} from "@/shared/components/molecules/currency-chip-selector";
import { CURRENCIES, type CurrencyCode } from "@/shared/constants/currencies";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type {
  SettlementValidationCode,
} from "../schemas/settlement-validation.types";
import { settlementsStyles as styles } from "../styles/settlements.styles";
import type { SettlementCurrencyOption } from "../utils/settlement-form";

export interface SettlementFormCurrencyChipsProps {
  value: CurrencyCode;
  /** Only the currencies with a debt are offered. */
  options: readonly SettlementCurrencyOption[];
  disabled: boolean;
  error?: SettlementValidationCode;
  onChange: (currency: CurrencyCode) => void;
}

/** Debt currencies of the pair; the settled ones never appear. */
export function SettlementFormCurrencyChips({
  value,
  options,
  disabled,
  error,
  onChange,
}: SettlementFormCurrencyChipsProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("settlements");
  const currencies = useMemo<CurrencyOption[]>(
    () =>
      CURRENCIES.filter((currency) =>
        options.some((option) => option.currency === currency.code),
      ),
    [options],
  );

  function accessibilityLabel(currency: CurrencyOption): string {
    return t("form.currencyAccessibility", { name: currency.code });
  }

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.currencyLabel")}</ThemedText>
      <CurrencyChipSelector
        value={value}
        disabled={disabled}
        currencies={currencies}
        getAccessibilityLabel={accessibilityLabel}
        onChange={onChange}
      />
      {error ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {tr(`errors.${error}`)}
        </ThemedText>
      ) : null}
    </View>
  );
}
