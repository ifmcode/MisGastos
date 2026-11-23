import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { settleButtonStyles as styles } from "./settle-button.styles";

export interface SettleButtonProps {
  /** Already translated button label. */
  label: string;
  accessibilityLabel: string;
  accessibilityHint: string;
  /** Optional leading icon; omitted when the surface needs no glyph. */
  icon?: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
}

/**
 * Primary "settle the debt" action shared by the friend header and the group
 * balances. Copy and callback stay with the feature that owns the namespace.
 */
export function SettleButton({
  label,
  accessibilityLabel,
  accessibilityHint,
  icon,
  onPress,
}: SettleButtonProps) {
  const theme = useFormTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.primary },
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={theme.onPrimary}
          accessible={false}
        />
      ) : null}
      <ThemedText style={[styles.text, { color: theme.onPrimary }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
