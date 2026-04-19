import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import { Pressable, StyleSheet } from "react-native";

export default function SettingsScreen() {
  const { user } = useAuth();

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

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <ThemedText style={styles.logoutText}>Cerrar Sesión</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    marginBottom: 24,
  },
  userInfo: {
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});