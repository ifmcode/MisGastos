import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { loginStyles as styles } from "../styles/login.styles";
import type { AuthFeedbackTone } from "../types/auth.types";

export interface AuthFeedbackProps {
  message?: string | null;
  tone?: AuthFeedbackTone;
  variant?: "field" | "banner";
}

/** Inline feedback for auth actions and fields, announced to screen readers. */
export function AuthFeedback({
  message,
  tone = "error",
  variant = "field",
}: AuthFeedbackProps) {
  const theme = useFormTheme();

  if (!message) {
    return null;
  }

  const isError = tone === "error";
  const color = isError ? theme.danger : theme.primary;

  if (variant === "field") {
    return (
      <ThemedText
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[styles.fieldError, { color }]}
      >
        {message}
      </ThemedText>
    );
  }

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.feedbackBanner,
        {
          backgroundColor: isError ? theme.dangerSurface : theme.primarySoft,
          borderColor: color,
        },
      ]}
    >
      <Ionicons
        name={isError ? "alert-circle" : "checkmark-circle"}
        size={18}
        color={color}
      />
      <ThemedText
        style={[
          styles.feedbackText,
          { color: isError ? theme.dangerText : theme.text },
        ]}
      >
        {message}
      </ThemedText>
    </View>
  );
}
