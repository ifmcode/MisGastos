import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { verifyEmailStyles as styles } from "../styles/verify-email.styles";

export interface VerifyEmailHeaderProps {
  email: string | null;
}

/** Explains why the user is here and which address must be confirmed. */
export function VerifyEmailHeader({ email }: VerifyEmailHeaderProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("auth");

  return (
    <View style={styles.header}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name="mail-unread-outline" size={30} color={theme.primary} />
      </View>

      <ThemedText type="title" style={styles.title}>
        {t("verify.title")}
      </ThemedText>

      <ThemedText style={styles.subtitle}>{t("verify.subtitle")}</ThemedText>

      {email ? (
        <ThemedText type="defaultSemiBold" style={styles.email}>
          {email}
        </ThemedText>
      ) : null}

      <ThemedText style={styles.hint}>{t("verify.hint")}</ThemedText>
    </View>
  );
}
