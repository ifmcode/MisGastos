import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";

import { loginStyles as styles } from "../styles/login.styles";

export interface LoginHeaderProps {
  isRegister: boolean;
}

export function LoginHeader({ isRegister }: LoginHeaderProps) {
  const { t } = useTranslation(["auth", "common"]);

  return (
    <>
      <ThemedText type="title" style={styles.title}>
        {t("common:appName")}
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        {isRegister ? t("login.registerTitle") : t("login.signInSubtitle")}
      </ThemedText>
    </>
  );
}
