import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { settingsStyles as styles } from "../styles/settings.styles";

/** Settings summary that opens the editable profile screen. */
export function SettingsProfileLink() {
  const theme = useFormTheme();
  const router = useRouter();
  const { t } = useTranslation("settings");
  const { user } = useAuth();
  const { profile } = useProfile();

  const displayName =
    profile?.displayName ?? user?.displayName ?? t("noName");
  const email = profile?.email ?? user?.email;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("editProfile")}
      onPress={() => router.push("/profile")}
      style={[
        styles.menuItem,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <Ionicons name="person-circle-outline" size={20} color={theme.primary} />

      <View style={styles.menuLabel}>
        <ThemedText type="defaultSemiBold">{t("profile")}</ThemedText>
        <ThemedText
          style={[styles.helper, { color: theme.muted }]}
          numberOfLines={1}
        >
          {displayName}
        </ThemedText>
        {email ? (
          <ThemedText
            style={[styles.helper, { color: theme.muted }]}
            numberOfLines={1}
          >
            {email}
          </ThemedText>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.muted} />
    </Pressable>
  );
}
