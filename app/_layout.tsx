import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { AuthNavigator } from '@/features/auth/components/auth-navigator';
import { AuthProvider } from '@/features/auth/providers/auth-provider';
import { FriendsPublicProfileSync } from '@/features/friends/components/friends-public-profile-sync';
import { NotificationBannerHost } from '@/features/notifications/components/notification-banner-host';
import { ProfileProvider } from '@/features/profile/providers/profile-provider';
import { SyncProvider } from '@/features/sync/providers/sync-provider';
import { DefaultWalletSeed } from '@/features/wallets/components/default-wallet-seed';
import { DevLogOverlay } from '@/shared/components/organisms/dev-log-overlay';
import { useAppColorScheme } from '@/shared/hooks/use-app-color-scheme';
import { useAppTheme } from '@/shared/hooks/use-app-theme';
import { AppLanguageProvider } from '@/shared/providers/language-provider';
import { AppThemeProvider } from '@/shared/providers/theme-provider';

export const unstable_settings = {
  anchor: '(tabs)',
};

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
          <SyncProvider>
            <ProfileProvider>
              <FriendsPublicProfileSync />
              <DefaultWalletSeed />
              {/* The banners are siblings of the navigator so they overlay every route. */}
              <View style={styles.root}>
                <RootNavigator />
                <NotificationBannerHost />
                <DevLogOverlay />
              </View>
            </ProfileProvider>
          </SyncProvider>
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
