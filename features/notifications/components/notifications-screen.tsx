import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useNotificationsScreen } from "../hooks/use-notifications-screen";
import { notificationsStyles as styles } from "../styles/notifications.styles";
import { InboxRequestsBlock } from "./inbox-requests-block";
import { NotificationsHeader } from "./notifications-header";
import { NotificationsList } from "./notifications-list";
import { NotificationsSegmentControl } from "./notifications-segment-control";

/**
 * Two-segment inbox: Pendientes / Vistas with their counts, the active list and
 * the loading and error states. Every rule lives in the hook.
 */
export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, tr } = useScopedTranslation(["notifications", "common"]);
  const screen = useNotificationsScreen();

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)" as Href);
  }, [router]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <NotificationsHeader
        title={t("title")}
        subtitle={t("subtitle")}
        onBack={leave}
      />

      <NotificationsSegmentControl
        segment={screen.segment}
        counts={screen.segmentCounts}
        onChange={screen.changeSegment}
      />

      {screen.status === "loading" ? (
        <LoadingState message={t("loading")} />
      ) : screen.status === "error" ? (
        <ErrorState
          title={t("errorTitle")}
          message={screen.error ?? ""}
          retryLabel={tr("common:actions.retry")}
          retryAccessibilityLabel={t("retryAccessibility")}
          onRetry={screen.reload}
        />
      ) : (
        <NotificationsList
          rows={screen.rows}
          segment={screen.segment}
          actionError={screen.actionError}
          canMarkAllRead={screen.canMarkAllRead}
          header={
            screen.segment === "pending" ? (
              <InboxRequestsBlock
                requests={screen.requests}
                segment={screen.segment}
              />
            ) : null
          }
          showEmpty={!screen.hasRequests}
          onMarkAllRead={screen.markAllRead}
          onOpenRow={screen.openRow}
        />
      )}
    </ThemedView>
  );
}
