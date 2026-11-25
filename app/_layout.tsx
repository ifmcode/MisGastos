import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { AuthNavigator } from '@/features/auth/components/auth-navigator';
import { AuthProvider } from '@/features/auth/providers/auth-provider';
import { FriendsPublicProfileSync } from '@/features/friends/components/friends-public-profile-sync';
import { NotificationBannerHost } from '@/features/notifications/components/notification-banner-host';
import { ProfileProvider } from '@/features/profile/providers/profile-provider';
import { OfflineBannerHost } from '@/features/sync/components/offline-banner-host';
import { DefaultWalletSeed } from '@/features/wallets/components/default-wallet-seed';
import { useAppColorScheme } from '@/shared/hooks/use-app-color-scheme';
import { useAppTheme } from '@/shared/hooks/use-app-theme';
import { AppLanguageProvider } from '@/shared/providers/language-provider';
import { AppThemeProvider } from '@/shared/providers/theme-provider';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * The Firestore SDK logs a connection warning on every launch while the device
 * is offline. LogBox renders them as dev-only toasts over the app (they are not
 * product UI, and its dark theme makes the text unreadable), while the offline
 * strip already reports the state. The real fix for the connection itself is
 * phase 5 of TICKET-023.
 */
if (__DEV__) {
  LogBox.ignoreLogs([
    'Could not reach Cloud Firestore backend',
    'WebChannelConnection',
    'RestConnection',
    'transport errored',
  ]);
}

function RootNavigator() {
  const colorScheme = useAppColorScheme();
  const { isDark } = useAppTheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppLanguageProvider>
      <AppThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <FriendsPublicProfileSync />
            <DefaultWalletSeed />
            {/* The banners are siblings of the navigator so they overlay every route. */}
            <View style={styles.root}>
              <RootNavigator />
              <NotificationBannerHost />
              <OfflineBannerHost />
            </View>
          </ProfileProvider>
        </AuthProvider>
      </AppThemeProvider>
    </AppLanguageProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
