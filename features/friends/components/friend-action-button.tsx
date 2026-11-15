import { ActivityIndicator, Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { friendsStyles as styles } from "../styles/friends.styles";

export type FriendActionButtonVariant = "primary" | "secondary" | "danger";

export interface FriendActionButtonProps {
  label: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  variant?: FriendActionButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

/** Compact action button shared by the search result and the request rows. */
export function FriendActionButton({
  label,
  accessibilityLabel,
  accessibilityHint,
  variant = "primary",
  loading = false,
  disabled = false,
  onPress,
}: FriendActionButtonProps) {
  const theme = useFormTheme();
  const isDisabled = disabled || loading;

  const colors: Record<FriendActionButtonVariant, {
    background: string;
    border: string;
    text: string;
  }> = {
    primary: {
      background: theme.primary,
      border: theme.primary,
      text: theme.onPrimary,
    },
    secondary: {
      background: theme.surface,
      border: theme.border,
      text: theme.text,
    },
    danger: {
      background: theme.dangerSurface,
      border: theme.danger,
      text: theme.dangerText,
    },
  };
  const palette = colors[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: palette.background, borderColor: palette.border },
        isDisabled && styles.actionButtonDisabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : null}
      <ThemedText style={[styles.actionButtonText, { color: palette.text }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
