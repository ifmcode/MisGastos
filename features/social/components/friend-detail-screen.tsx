import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { Fab } from "@/shared/components/molecules/fab";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useFriendDetailScreen } from "../hooks/use-friend-detail-screen";
import { friendDetailStyles as styles } from "../styles/friend-detail.styles";
import { FriendDetailExpenses } from "./friend-detail-expenses";
import { FriendDetailHeader } from "./friend-detail-header";
import { FriendDetailMissingState } from "./friend-detail-missing-state";
import { FriendDetailModals } from "./friend-detail-modals";
import { SocialRouteHeader } from "./social-route-header";

function readUid(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim();
}

/** Friend detail: identity and balances, pair expenses and the remove action. */
export function FriendDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useFormTheme();
  const { t } = useTranslation(["social", "common"]);
  const params = useLocalSearchParams<{ uid?: string | string[] }>();
  const screen = useFriendDetailScreen({ uid: readUid(params.uid) });
  const { editor, removal, header } = screen;
  // Loading and full errors have no friend header yet, so they keep a back action.
  const showRouteHeader =
    screen.status === "loading" || screen.status === "error";

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/social" as Href);
  }, [router]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {showRouteHeader ? (
        <SocialRouteHeader
          title={t("friendDetail.title")}
          onBack={leave}
        />
      ) : null}

      {screen.status === "loading" ? (
        <LoadingState message={t("friendDetail.loading")} />
      ) : screen.status === "error" ? (
        <ErrorState
          title={t("friendDetail.errorTitle")}
          message={screen.error ?? ""}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("friendDetail.retryAccessibility")}
          onRetry={screen.reload}
        />
      ) : !header ? (
        <FriendDetailMissingState onBack={leave} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={screen.refreshing}
              onRefresh={screen.refresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          <ErrorBanner message={screen.error} />

          <FriendDetailHeader
            header={header}
            busy={removal.busy}
            removing={removal.removing}
            onBack={leave}
            onRemove={removal.requestRemove}
          />

          <ErrorBanner message={screen.removalError} />
          <ErrorBanner message={screen.expenseError} />

          <FriendDetailExpenses
            expenses={screen.expenses}
            friends={screen.friends}
            viewerUid={screen.viewerUid}
            loading={screen.expensesLoading}
            error={screen.expensesError}
            pendingId={screen.pendingId}
            onRetry={screen.reloadExpenses}
            onEdit={editor.openEdit}
            onDelete={screen.requestDelete}
          />
        </ScrollView>
      )}

      {header ? (
        <Fab
          accessibilityLabel={t("friendDetail.fabAccessibility", {
            name: header.name,
          })}
          accessibilityHint={t("friendDetail.fabHint")}
          bottom={insets.bottom + 24}
          onPress={editor.openCreate}
        />
      ) : null}

      <FriendDetailModals
        editor={editor}
        friends={screen.friends}
        removeConfirm={removal.confirm}
        deleteConfirm={screen.deleteConfirm}
      />
    </ThemedView>
  );
}
