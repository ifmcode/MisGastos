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
import { DefaultWalletSeed } from '@/features/wallets/components/default-wallet-seed';
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
          <ProfileProvider>
            <FriendsPublicProfileSync />
            <DefaultWalletSeed />
            {/* The banner is a sibling of the navigator so it overlays every route. */}
            <View style={styles.root}>
              <RootNavigator />
              <NotificationBannerHost />
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
