import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { CURRENCIES, CurrencyCode } from "@/shared/constants/currencies";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { formatCurrencyLabel } from "@/shared/utils/currency-label";

import { currencyChipSelectorStyles as styles } from "./currency-chip-selector.styles";

export type CurrencyOption = (typeof CURRENCIES)[number];

export interface CurrencyChipSelectorProps {
  value: CurrencyCode;
  disabled?: boolean;
  /**
   * Optional subset of currencies, for screens that can only offer a few (for
   * example the debt currencies of a friend). Defaults to every currency.
   */
  currencies?: readonly CurrencyOption[];
  /** Accessibility copy is provided by the feature translation namespace. */
  getAccessibilityLabel: (currency: CurrencyOption) => string;
  onChange: (currency: CurrencyCode) => void;
}

/** Shared currency chips used by the pickers and the profile form. */
export function CurrencyChipSelector({
  value,
  disabled = false,
  currencies = CURRENCIES,
  getAccessibilityLabel,
  onChange,
}: CurrencyChipSelectorProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.chipsWrap}>
      {currencies.map((currency) => {
        const selected = value === currency.code;

        return (
          <Pressable
            key={currency.code}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={getAccessibilityLabel(currency)}
            onPress={() => onChange(currency.code)}
            disabled={disabled}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.primary : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.chipText,
                { color: selected ? theme.onPrimary : theme.text },
              ]}
            >
              {formatCurrencyLabel(currency.code)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
