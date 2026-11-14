import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { errorStateStyles as styles } from "./error-state.styles";

export type ErrorStateVariant = "screen" | "inline";

export interface ErrorStateProps {
  /** Already translated. Omitted in the inline variant. */
  title?: string;
  message: string;
  retryLabel: string;
  retryAccessibilityLabel: string;
  onRetry: () => void;
  variant?: ErrorStateVariant;
}

/** Screen-level or section-level error feedback with an explicit retry action. */
export function ErrorState({
  title,
  message,
  retryLabel,
  retryAccessibilityLabel,
  onRetry,
  variant = "screen",
}: ErrorStateProps) {
  const theme = useFormTheme();

  if (variant === "inline") {
    return (
      <View style={[styles.inline, { backgroundColor: theme.dangerSurface }]}>
        <ThemedText style={[styles.inlineText, { color: theme.dangerText }]}>
          {message}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={retryAccessibilityLabel}
          onPress={onRetry}
        >
          <ThemedText
            style={[styles.inlineRetryText, { color: theme.danger }]}
          >
            {retryLabel}
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Ionicons name="cloud-offline-outline" size={42} color={theme.danger} />
      {title ? (
        <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
          {title}
        </ThemedText>
      ) : null}
      <ThemedText style={styles.screenText}>{message}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={retryAccessibilityLabel}
        onPress={onRetry}
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
      >
        <ThemedText
          style={[styles.retryButtonText, { color: theme.onPrimary }]}
        >
          {retryLabel}
        </ThemedText>
      </Pressable>
    </View>
  );
}
