import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletFormStyles as styles } from "../styles/wallet-form.styles";
import { WALLET_ICONS } from "../utils/wallet-options";

export interface WalletFormIconSelectorProps {
  value: string;
  disabled: boolean;
  onChange: (icon: string) => void;
}

export function WalletFormIconSelector({
  value,
  disabled,
  onChange,
}: WalletFormIconSelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("wallets");

  return (
    <View style={styles.iconGrid}>
      {WALLET_ICONS.map((icon) => {
        const selected = value === icon;

        return (
          <Pressable
            key={icon}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={t("types.iconAccessibility", { name: icon })}
            onPress={() => onChange(icon)}
            disabled={disabled}
            style={[
              styles.iconButton,
              {
                backgroundColor: selected ? theme.primary : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={22}
              color={selected ? theme.onPrimary : theme.muted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
