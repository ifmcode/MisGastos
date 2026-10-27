import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { logout } from '@/lib/auth';

export function DashboardScreen() {
  const { user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <Image
        source={require('@/assets/images/partial-react-logo.png')}
        style={styles.logo}
      />
      <ThemedText type="title" style={styles.greeting}>
        Hola, {user?.displayName ?? user?.email ?? 'Usuario'}
      </ThemedText>
      <Pressable style={styles.logoutButton} onPress={logout}>
        <ThemedText style={styles.logoutText}>Cerrar sesión</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    height: 120,
    width: 200,
    marginBottom: 24,
  },
  greeting: {
    marginBottom: 32,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
