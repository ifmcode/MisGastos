import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { walletFormStyles as styles } from "../styles/wallet-form.styles";
import { WalletType } from "../types/wallet.types";
import { WALLET_TYPE_OPTIONS } from "../utils/wallet-options";

export interface WalletFormTypeSelectorProps {
  value: WalletType;
  disabled: boolean;
  onChange: (type: WalletType) => void;
}

export function WalletFormTypeSelector({
  value,
  disabled,
  onChange,
}: WalletFormTypeSelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("wallets");
  const tr = asTranslate(t);

  return (
    <View style={styles.chipsWrap}>
      {WALLET_TYPE_OPTIONS.map((option) => {
        const selected = value === option.value;
        const label = tr(option.labelKey);

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={t("types.typeAccessibility", { label })}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            style={[
              styles.typeChip,
              {
                backgroundColor: selected ? theme.primary : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            <Ionicons
              name={option.icon}
              size={17}
              color={selected ? theme.onPrimary : theme.muted}
            />
            <ThemedText
              style={[
                styles.typeChipText,
                { color: selected ? theme.onPrimary : theme.text },
              ]}
            >
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
