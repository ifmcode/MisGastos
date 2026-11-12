import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuthService } from "@/features/auth/hooks/use-auth-service";
import { useAuth } from "@/hooks/use-auth";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { settingsStyles as styles } from "../styles/settings.styles";
import { SettingsLanguageSelector } from "./settings-language-selector";
import { SettingsThemeToggle } from "./settings-theme-toggle";

export function SettingsScreen() {
  const { user } = useAuth();
  const authService = useAuthService();
  const router = useRouter();
  const theme = useFormTheme();
  const { t } = useTranslation("settings");

  const handleLogout = () => {
    void authService.logout();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        {t("title")}
      </ThemedText>

      {user && (
        <ThemedView style={styles.userInfo}>
          <ThemedText type="subtitle">{t("currentUser")}</ThemedText>
          <ThemedText>{user.email}</ThemedText>
          <ThemedText>{user.displayName || t("noName")}</ThemedText>
        </ThemedView>
      )}

      <ThemedView style={styles.menu}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("manageCategories")}
          onPress={() => router.push("/categories")}
          style={[
            styles.menuItem,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
        >
          <Ionicons name="pricetags-outline" size={20} color={theme.primary} />
          <ThemedText type="defaultSemiBold" style={styles.menuLabel}>
            {t("categories")}
          </ThemedText>
          <Ionicons name="chevron-forward" size={18} color={theme.muted} />
        </Pressable>

        <SettingsThemeToggle />
        <SettingsLanguageSelector />
      </ThemedView>

      <Pressable
        style={[styles.logoutButton, { backgroundColor: theme.danger }]}
        onPress={handleLogout}
      >
        <ThemedText style={[styles.logoutText, { color: theme.onPrimary }]}>
          {t("logout")}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}
