import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { CURRENCIES, CurrencyCode } from "@/shared/constants/currencies";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { currencyChipSelectorStyles as styles } from "./currency-chip-selector.styles";

export type CurrencyOption = (typeof CURRENCIES)[number];

export interface CurrencyChipSelectorProps {
  value: CurrencyCode;
  disabled?: boolean;
  /** Accessibility copy is provided by the feature translation namespace. */
  getAccessibilityLabel: (currency: CurrencyOption) => string;
  onChange: (currency: CurrencyCode) => void;
}

/** Shared currency chips used by the wallet and profile forms. */
export function CurrencyChipSelector({
  value,
  disabled = false,
  getAccessibilityLabel,
  onChange,
}: CurrencyChipSelectorProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.chipsWrap}>
      {CURRENCIES.map((currency) => {
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
              {currency.code} {currency.symbol}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
