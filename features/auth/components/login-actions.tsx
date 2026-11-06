import { ActivityIndicator, Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { loginPalette, loginStyles as styles } from "../styles/login.styles";
import { AuthFeedback } from "./auth-feedback";

export interface LoginActionsProps {
  isRegister: boolean;
  loading: boolean;
  emailError?: string | null;
  googleError?: string | null;
  onSubmit: () => void;
  onGoogleLogin: () => void;
}

export function LoginActions({
  isRegister,
  loading,
  emailError,
  googleError,
  onSubmit,
  onGoogleLogin,
}: LoginActionsProps) {
  return (
    <>
      <AuthFeedback message={emailError} variant="banner" />

      <Pressable
        style={[styles.button, styles.emailButton, loading && styles.disabled]}
        onPress={onSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color={loginPalette.onPrimary} />
        ) : (
          <ThemedText style={styles.buttonText}>
            {isRegister ? "Registrarse" : "Iniciar sesión con Email"}
          </ThemedText>
        )}
      </Pressable>

      {isRegister ? null : (
        <>
          <AuthFeedback message={googleError} variant="banner" />

          <Pressable
            style={[
              styles.button,
              styles.googleButton,
              loading && styles.disabled,
            ]}
            onPress={onGoogleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading, busy: loading }}
          >
            <ThemedText style={styles.buttonText}>
              Iniciar sesión con Google
            </ThemedText>
          </Pressable>
        </>
      )}
    </>
  );
}
