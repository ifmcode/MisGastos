import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme, type FormTheme } from "@/shared/hooks/use-form-theme";

import { groupJoinStyles as styles } from "../styles/group-join.styles";

export type GroupJoinActionVariant = "primary" | "secondary" | "danger";

interface GroupJoinActionPalette {
  background: string;
  border: string;
  text: string;
}

/** Variant palette from the theme; no colour is hardcoded in the component. */
function getGroupJoinActionPalette(
  theme: FormTheme,
  variant: GroupJoinActionVariant,
): GroupJoinActionPalette {
  if (variant === "secondary") {
    return { background: theme.surface, border: theme.border, text: theme.text };
  }
  if (variant === "danger") {
    return {
      background: theme.dangerSurface,
      border: theme.danger,
      text: theme.dangerText,
    };
  }

  return {
    background: theme.primary,
    border: theme.primary,
    text: theme.onPrimary,
  };
}

export interface GroupJoinActionButtonProps {
  /** Already translated label. */
  label: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  variant?: GroupJoinActionVariant;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

/** Compact action of the join code surfaces, with an optional leading icon. */
export function GroupJoinActionButton({
  label,
  accessibilityLabel,
  accessibilityHint,
  icon,
  variant = "primary",
  loading = false,
  disabled = false,
  onPress,
}: GroupJoinActionButtonProps) {
  const theme = useFormTheme();
  const isDisabled = disabled || loading;
  const palette = getGroupJoinActionPalette(theme, variant);

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
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : icon ? (
        <Ionicons name={icon} size={18} color={palette.text} accessible={false} />
      ) : null}
      <ThemedText style={[styles.actionLabel, { color: palette.text }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
