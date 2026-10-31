import { ThemedText } from "@/components/themed-text";

import { loginStyles as styles } from "../styles/login.styles";

export interface LoginHeaderProps {
  isRegister: boolean;
}

export function LoginHeader({ isRegister }: LoginHeaderProps) {
  return (
    <>
      <ThemedText type="title" style={styles.title}>
        MisGastos
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        {isRegister ? "Crea una cuenta" : "Inicia sesión para continuar"}
      </ThemedText>
    </>
  );
}
