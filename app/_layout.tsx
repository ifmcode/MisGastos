import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { AuthNavigator } from '@/features/auth/components/auth-navigator';
import { AuthProvider } from '@/features/auth/providers/auth-provider';
import { useAppColorScheme } from '@/shared/hooks/use-app-color-scheme';
import { useAppTheme } from '@/shared/hooks/use-app-theme';
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
    <AppThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </AppThemeProvider>
  );
}
