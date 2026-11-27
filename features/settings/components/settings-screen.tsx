import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SyncStatusBlock } from "@/features/sync/components/sync-status-block";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { settingsStyles as styles } from "../styles/settings.styles";
import { SettingsLanguageSelector } from "./settings-language-selector";
import { SettingsLogoutSection } from "./settings-logout-section";
import { SettingsProfileLink } from "./settings-profile-link";
import { SettingsSharedExpenseToggle } from "./settings-shared-expense-toggle";
import { SettingsThemeToggle } from "./settings-theme-toggle";

export function SettingsScreen() {
  const router = useRouter();
  const theme = useFormTheme();
  const { t } = useTranslation("settings");

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        {t("title")}
      </ThemedText>

      <ThemedView style={styles.profileSection}>
        <SettingsProfileLink />
      </ThemedView>

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
        <SettingsSharedExpenseToggle />
        <SyncStatusBlock />
      </ThemedView>

      <SettingsLogoutSection />
    </ThemedView>
  );
}
