import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { categorySelectButtonStyles as styles } from "./category-select-button.styles";

/** Empty-state glyph; the shared trigger owns every optional detail. */
const EMPTY_ICON: ComponentProps<typeof Ionicons>["name"] = "pricetag-outline";

export interface CategorySelectButtonProps {
  /** Chosen category icon, or `null` while the field is still empty. */
  icon: ComponentProps<typeof Ionicons>["name"] | null;
  /** Already translated: the category name or the empty-state label. */
  label: string;
  /** Already translated by the caller, which knows the field context. */
  accessibilityLabel: string;
  /** Already translated by the caller. */
  accessibilityHint: string;
  disabled?: boolean;
  hasError?: boolean;
  /** Category colour; the theme primary is used when it is omitted. */
  iconColor?: string;
  onPress: () => void;
}

/**
 * Single category trigger shared by the three category fields: the chosen
 * category once there is one, otherwise the translated empty-state label. It
 * only opens the popup; selection belongs to the caller.
 */
export function CategorySelectButton({
  icon,
  label,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  hasError = false,
  iconColor,
  onPress,
}: CategorySelectButtonProps) {
  const theme = useFormTheme();
  const empty = icon === null;
  const accent = empty ? undefined : iconColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.trigger,
        {
          backgroundColor: theme.surface,
          borderColor: hasError ? theme.danger : theme.border,
        },
        empty && styles.triggerEmpty,
        pressed && styles.triggerPressed,
        disabled && styles.triggerDisabled,
      ]}
    >
      <View
        style={[
          styles.iconBubble,
          { backgroundColor: accent ? `${accent}1A` : theme.primarySoft },
        ]}
      >
        <Ionicons
          name={icon ?? EMPTY_ICON}
          size={20}
          color={accent ?? theme.primary}
          accessible={false}
        />
      </View>

      <ThemedText
        numberOfLines={1}
        style={[styles.label, { color: empty ? theme.primary : theme.text }]}
      >
        {label}
      </ThemedText>

      <Ionicons
        name="chevron-down"
        size={18}
        color={theme.muted}
        accessible={false}
      />
    </Pressable>
  );
}
