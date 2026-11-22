import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletPickerStyles as styles } from "../styles/wallet-picker.styles";

/** First row of the picker that clears the selection, e.g. an optional wallet. */
export interface WalletPickerNoneOption {
  label: string;
  accessibilityLabel: string;
}

export interface WalletPickerNoneOptionRowProps {
  option: WalletPickerNoneOption;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}

export function WalletPickerNoneOptionRow({
  option,
  selected,
  disabled,
  onSelect,
}: WalletPickerNoneOptionRowProps) {
  const theme = useFormTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={option.accessibilityLabel}
      onPress={onSelect}
      disabled={disabled}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? theme.primarySoft : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed && styles.optionPressed,
      ]}
    >
      <View style={styles.optionText}>
        <ThemedText
          type="defaultSemiBold"
          numberOfLines={1}
          style={[
            styles.optionName,
            { color: selected ? theme.primary : theme.text },
          ]}
        >
          {option.label}
        </ThemedText>
      </View>
      {selected ? (
        <Ionicons name="checkmark" size={18} color={theme.primary} />
      ) : null}
    </Pressable>
  );
}
