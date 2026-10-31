import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { loginStyles as styles } from "../styles/login.styles";

export interface LoginModeToggleProps {
  isRegister: boolean;
  onToggle: () => void;
}

export function LoginModeToggle({
  isRegister,
  onToggle,
}: LoginModeToggleProps) {
  return (
    <Pressable style={styles.toggleButton} onPress={onToggle}>
      <ThemedText style={styles.toggleText}>
        {isRegister
          ? "¿Ya tienes cuenta? Inicia sesión"
          : "¿No tienes cuenta? Regístrate"}
      </ThemedText>
    </Pressable>
  );
}
