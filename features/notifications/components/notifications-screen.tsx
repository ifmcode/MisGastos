import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useNotificationsScreen } from "../hooks/use-notifications-screen";
import { notificationsStyles as styles } from "../styles/notifications.styles";
import { NotificationRow } from "./notification-row";
import { NotificationsHeader } from "./notifications-header";

/** Minimal in-app inbox: list, unread marker, mark-as-read and target routing. */
export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useFormTheme();
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
        <FlatList
          data={screen.rows}
          keyExtractor={(row) => row.id}
          renderItem={({ item }) => (
            <NotificationRow row={item} onPress={() => screen.openRow(item.id)} />
          )}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<ErrorBanner message={screen.actionError} />}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title={t("emptyTitle")}
              message={t("emptyMessage")}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={screen.refreshing}
              onRefresh={screen.refresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />
      )}
    </ThemedView>
  );
}
