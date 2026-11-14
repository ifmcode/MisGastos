import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { profileStyles as styles } from "../styles/profile.styles";

export interface ProfileAccountCardProps {
  email: string | null;
}

/** Read-only account data; only the display name and currency are editable. */
export function ProfileAccountCard({ email }: ProfileAccountCardProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("profile");

  return (
    <View
      style={[
        styles.accountCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <Ionicons name="mail-outline" size={20} color={theme.primary} />

      <View style={styles.accountText}>
        <ThemedText type="defaultSemiBold">{t("account.email")}</ThemedText>
        <ThemedText style={[styles.accountEmail, { color: theme.text }]}>
          {email ?? t("account.noEmail")}
        </ThemedText>
        <ThemedText style={[styles.accountHint, { color: theme.muted }]}>
          {t("account.emailHint")}
        </ThemedText>
      </View>
    </View>
  );
}
