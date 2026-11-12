import { Ionicons } from "@expo/vector-icons";
import { Switch, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/shared/hooks/use-app-theme";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { settingsStyles as styles } from "../styles/settings.styles";

/** Manual dark-mode switch. Follows the system until the user changes it. */
export function SettingsThemeToggle() {
  const theme = useFormTheme();
  const { t } = useTranslation("settings");
  const { isDark, ready, setDarkMode } = useAppTheme();

  return (
    <View
      style={[
        styles.menuItem,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <Ionicons
        name={isDark ? "moon" : "moon-outline"}
        size={20}
        color={theme.primary}
      />
      <View style={styles.menuLabel}>
        <ThemedText type="defaultSemiBold">{t("theme.label")}</ThemedText>
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {isDark ? t("theme.on") : t("theme.off")}
        </ThemedText>
      </View>
      <Switch
        value={isDark}
        onValueChange={setDarkMode}
        disabled={!ready}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={theme.onPrimary}
        accessibilityRole="switch"
        accessibilityLabel={t("theme.accessibility")}
        accessibilityState={{ checked: isDark, disabled: !ready }}
      />
    </View>
  );
}
