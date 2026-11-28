import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { NotificationsBell } from "@/features/notifications/components/notifications-bell";
import { SyncStatusButton } from "@/features/sync/components/sync-status-button";

import { dashboardStyles } from "../styles/dashboard.styles";

export interface DashboardHeaderProps {
  greeting: string;
  /** Pending notifications plus requests of the bell badge. */
  inboxCount?: number;
  /** Opens `/notifications`; the bell is hidden without it. */
  onOpenNotifications?: () => void;
}

export function DashboardHeader({
  greeting,
  inboxCount = 0,
  onOpenNotifications,
}: DashboardHeaderProps) {
  const { t } = useTranslation("dashboard");

  return (
    <View style={dashboardStyles.header}>
      <View style={dashboardStyles.headerText}>
        <ThemedText
          type="title"
          style={dashboardStyles.title}
          numberOfLines={1}
        >
          {greeting}
        </ThemedText>
        <ThemedText style={dashboardStyles.subtitle}>
          {t("subtitle")}
        </ThemedText>
      </View>
      <View style={dashboardStyles.headerActions}>
        <SyncStatusButton />
        {onOpenNotifications ? (
          <NotificationsBell count={inboxCount} onPress={onOpenNotifications} />
        ) : null}
      </View>
    </View>
  );
}
