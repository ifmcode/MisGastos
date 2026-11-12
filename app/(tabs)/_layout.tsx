import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/shared/constants/app-colors';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppColorScheme } from '@/shared/hooks/use-app-color-scheme';

export default function TabLayout() {
  const colorScheme = useAppColorScheme();
  const { t } = useTranslation('navigation');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallets"
        options={{
          title: t('tabs.wallets'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="creditcard.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t('tabs.transactions'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}
