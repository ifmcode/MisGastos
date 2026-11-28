import type { ReactNode } from "react";
import { FlatList, View } from "react-native";

import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { notificationsStyles as styles } from "../styles/notifications.styles";
import type { NotificationSegment } from "../types/notification-segment.types";
import type { NotificationRowModel } from "../utils/notification-rows";
import { NotificationRow } from "./notification-row";
import { NotificationsMarkAllRead } from "./notifications-mark-all-read";

export interface NotificationsListProps {
  rows: readonly NotificationRowModel[];
  segment: NotificationSegment;
  actionError: string | null;
  canMarkAllRead: boolean;
  /** Rendered above the mark-all-read action, inside the list header. */
  header?: ReactNode;
  /** Hides the empty state when another block already fills the segment. */
  showEmpty?: boolean;
  onMarkAllRead: () => Promise<void>;
  onOpenRow: (notificationId: string) => void;
}

/**
 * Rows of the active segment, its own empty state and the mark-all-read action,
 * which only exists while there is something unread to stamp in Pendientes.
 */
export function NotificationsList({
  rows,
  segment,
  actionError,
  canMarkAllRead,
  header,
  showEmpty = true,
  onMarkAllRead,
  onOpenRow,
}: NotificationsListProps) {
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
          {header}
          <ErrorBanner message={actionError} />
          {canMarkAllRead ? (
            <NotificationsMarkAllRead onPress={onMarkAllRead} />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        showEmpty ? (
          <EmptyState
            icon={pending ? "notifications-outline" : "archive-outline"}
            title={pending ? t("empty.pendingTitle") : t("empty.viewedTitle")}
            message={
              pending ? t("empty.pendingMessage") : t("empty.viewedMessage")
            }
          />
        ) : undefined
      }
    />
  );
}
