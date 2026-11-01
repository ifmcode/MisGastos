import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { settingsStyles as styles } from "../styles/settings.styles";

export function SettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useFormTheme();

  const handleLogout = () => {
    logout();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Configuración
      </ThemedText>

      {user && (
        <ThemedView style={styles.userInfo}>
          <ThemedText type="subtitle">Usuario actual:</ThemedText>
          <ThemedText>{user.email}</ThemedText>
          <ThemedText>{user.displayName || "Sin nombre"}</ThemedText>
        </ThemedView>
      )}

      <ThemedView style={styles.menu}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Gestionar categorías"
          onPress={() => router.push("/categories")}
          style={[
            styles.menuItem,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
        >
          <Ionicons name="pricetags-outline" size={20} color={theme.primary} />
          <ThemedText type="defaultSemiBold" style={styles.menuLabel}>
            Categorías
          </ThemedText>
          <Ionicons name="chevron-forward" size={18} color={theme.muted} />
        </Pressable>
      </ThemedView>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <ThemedText style={styles.logoutText}>Cerrar Sesión</ThemedText>
      </Pressable>
    </ThemedView>
  );
}
