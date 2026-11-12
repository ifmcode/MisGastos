import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { loginStyles as styles } from "../styles/login.styles";
import type { AuthFeedbackMessage } from "../types/auth.types";
import { AuthFeedback } from "./auth-feedback";

export interface LoginPasswordResetProps {
  isRegister: boolean;
  loading: boolean;
  feedback: AuthFeedbackMessage | null;
  onReset: () => void;
}

/** Forgot-password action with its own inline feedback. */
export function LoginPasswordReset({
  isRegister,
  loading,
  feedback,
  onReset,
}: LoginPasswordResetProps) {
  const { t } = useTranslation("auth");

  if (isRegister) {
    return null;
  }

  return (
    <View style={styles.resetSection}>
      <AuthFeedback
        message={feedback?.message}
        tone={feedback?.tone}
        variant="banner"
      />
      <Pressable
        style={[styles.resetButton, loading && styles.disabled]}
        onPress={onReset}
        disabled={loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading, busy: loading }}
      >
        <ThemedText style={styles.resetText}>
          {t("login.forgotPassword")}
        </ThemedText>
      </Pressable>
    </View>
  );
}
