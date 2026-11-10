import { Ionicons } from "@expo/vector-icons";
import { Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/shared/hooks/use-app-theme";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { settingsStyles as styles } from "../styles/settings.styles";

/** Manual dark-mode switch. Follows the system until the user changes it. */
export function SettingsThemeToggle() {
  const theme = useFormTheme();
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
        <ThemedText type="defaultSemiBold">Modo oscuro</ThemedText>
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {isDark ? "Activado" : "Desactivado"}
        </ThemedText>
      </View>
      <Switch
        value={isDark}
        onValueChange={setDarkMode}
        disabled={!ready}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={theme.onPrimary}
        accessibilityRole="switch"
        accessibilityLabel="Activar modo oscuro"
        accessibilityState={{ checked: isDark, disabled: !ready }}
      />
    </View>
  );
}
