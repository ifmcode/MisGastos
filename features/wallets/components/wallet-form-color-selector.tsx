import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletFormStyles as styles } from "../styles/wallet-form.styles";
import { WALLET_COLORS } from "../utils/wallet-options";

export interface WalletFormColorSelectorProps {
  value: string;
  disabled: boolean;
  onChange: (color: string) => void;
}

export function WalletFormColorSelector({
  value,
  disabled,
  onChange,
}: WalletFormColorSelectorProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.colorRow}>
      {WALLET_COLORS.map((color) => {
        const selected = value === color;

        return (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Color ${color}`}
            onPress={() => onChange(color)}
            disabled={disabled}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              selected && { borderColor: theme.text },
            ]}
          >
            {selected ? (
              <Ionicons name="checkmark" size={18} color={theme.onPrimary} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
