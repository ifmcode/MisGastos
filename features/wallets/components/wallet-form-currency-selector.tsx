import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { CURRENCIES, CurrencyCode } from "@/shared/constants/currencies";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletFormStyles as styles } from "../styles/wallet-form.styles";

export interface WalletFormCurrencySelectorProps {
  value: CurrencyCode;
  disabled: boolean;
  onChange: (currency: CurrencyCode) => void;
}

export function WalletFormCurrencySelector({
  value,
  disabled,
  onChange,
}: WalletFormCurrencySelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("wallets");

  return (
    <View style={styles.chipsWrap}>
      {CURRENCIES.map((currency) => {
        const selected = value === currency.code;

        return (
          <Pressable
            key={currency.code}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={t("types.currencyAccessibility", {
              name: currency.code,
            })}
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
