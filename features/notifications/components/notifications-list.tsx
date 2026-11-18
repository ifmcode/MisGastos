import { FlatList, RefreshControl, View } from "react-native";

import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { notificationsStyles as styles } from "../styles/notifications.styles";
import type { NotificationSegment } from "../types/notification-segment.types";
import type { NotificationRowModel } from "../utils/notification-rows";
import { NotificationRow } from "./notification-row";
import { NotificationsMarkAllRead } from "./notifications-mark-all-read";

export interface NotificationsListProps {
  rows: readonly NotificationRowModel[];
  segment: NotificationSegment;
  refreshing: boolean;
  actionError: string | null;
  canMarkAllRead: boolean;
  onRefresh: () => void;
  onMarkAllRead: () => Promise<void>;
  onOpenRow: (notificationId: string) => void;
}

/**
 * Rows of the active segment with pull-to-refresh, its own empty state and the
 * mark-all-read action, which only exists while there is something unread to
 * stamp in Pendientes.
 */
export function NotificationsList({
  rows,
  segment,
  refreshing,
  actionError,
  canMarkAllRead,
  onRefresh,
  onMarkAllRead,
  onOpenRow,
}: NotificationsListProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("notifications");
  const pending = segment === "pending";

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.id}
      renderItem={({ item }) => (
        <NotificationRow row={item} onPress={() => onOpenRow(item.id)} />
      )}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <ErrorBanner message={actionError} />
          {canMarkAllRead ? (
            <NotificationsMarkAllRead onPress={onMarkAllRead} />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon={pending ? "notifications-outline" : "archive-outline"}
          title={pending ? t("empty.pendingTitle") : t("empty.viewedTitle")}
          message={
            pending ? t("empty.pendingMessage") : t("empty.viewedMessage")
          }
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    />
  );
}
