import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { emptyStateStyles as styles } from "./empty-state.styles";

export type EmptyStateVariant = "screen" | "card";
export type EmptyStateIconName = ComponentProps<typeof Ionicons>["name"];

export interface EmptyStateAction {
  /** Already translated label and accessibility label. */
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  icon?: EmptyStateIconName;
}

export interface EmptyStateProps {
  /** Only used by the screen variant. */
  icon?: EmptyStateIconName;
  title: string;
  message: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  variant?: EmptyStateVariant;
}

/** Screen-level or compact-card empty feedback with optional action slots. */
export function EmptyState({
  icon,
  title,
  message,
  primaryAction,
  secondaryAction,
  variant = "screen",
}: EmptyStateProps) {
  const theme = useFormTheme();

  function renderAction(action: EmptyStateAction, primary: boolean) {
    const color = primary ? theme.onPrimary : theme.primary;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.accessibilityLabel}
        onPress={action.onPress}
        style={
          primary
            ? [styles.primaryAction, { backgroundColor: theme.primary }]
            : styles.secondaryAction
        }
      >
        {action.icon ? (
          <Ionicons name={action.icon} size={20} color={color} />
        ) : null}
        <ThemedText
          style={
            primary
              ? [styles.primaryActionText, { color }]
              : [styles.secondaryActionText, { color }]
          }
        >
          {action.label}
        </ThemedText>
      </Pressable>
    );
  }

  if (variant === "card") {
    return (
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        <ThemedText style={styles.cardMessage}>{message}</ThemedText>
        {primaryAction ? renderAction(primaryAction, true) : null}
        {secondaryAction ? renderAction(secondaryAction, false) : null}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name={icon} size={36} color={theme.primary} />
        </View>
      ) : null}
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText style={styles.message}>{message}</ThemedText>
      {primaryAction ? renderAction(primaryAction, true) : null}
      {secondaryAction ? renderAction(secondaryAction, false) : null}
    </View>
  );
}
