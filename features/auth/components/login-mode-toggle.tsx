import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("auth");

  return (
    <Pressable style={styles.toggleButton} onPress={onToggle}>
      <ThemedText style={styles.toggleText}>
        {isRegister ? t("login.haveAccount") : t("login.noAccount")}
      </ThemedText>
    </Pressable>
  );
}
