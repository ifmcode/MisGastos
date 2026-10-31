import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

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

  return (
    <View style={styles.chipsWrap}>
      {WALLET_TYPE_OPTIONS.map((option) => {
        const selected = value === option.value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Tipo ${option.label}`}
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
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
