import { ActivityIndicator, Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { loginPalette, loginStyles as styles } from "../styles/login.styles";

export interface LoginActionsProps {
  isRegister: boolean;
  loading: boolean;
  onSubmit: () => void;
  onGoogleLogin: () => void;
}

export function LoginActions({
  isRegister,
  loading,
  onSubmit,
  onGoogleLogin,
}: LoginActionsProps) {
  return (
    <>
      <Pressable
        style={[styles.button, styles.emailButton]}
        onPress={onSubmit}
        disabled={loading}
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
        <Pressable
          style={[styles.button, styles.googleButton]}
          onPress={onGoogleLogin}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            Iniciar sesión con Google
          </ThemedText>
        </Pressable>
      )}
    </>
  );
}
