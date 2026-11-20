import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { FriendRequestSection } from "@/features/friends/components/friend-request-section";
import { GroupInvitationsSection } from "@/features/groups/components/group-invitations-section";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useRequestsScreen } from "../hooks/use-requests-screen";
import { socialStyles as styles } from "../styles/social.styles";
import { SocialRouteHeader } from "./social-route-header";

/** Friend requests and received group invitations, with their actions. */
export function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useFormTheme();
  const { t } = useTranslation(["social", "friends", "common"]);
  const screen = useRequestsScreen();
  const hasData = screen.total > 0;
  const loading = screen.loading || screen.groupsLoading;
  const showFullError = !!screen.error && !hasData;
  const showEmpty =
    !screen.loading &&
    !screen.groupsLoading &&
    screen.total === 0 &&
    !screen.groupError;
  const subtitle =
    loading || showFullError
      ? undefined
      : hasData
        ? t("requests.subtitle", { count: screen.total })
        : t("requests.subtitleEmpty");

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <SocialRouteHeader
        title={t("requests.title")}
        subtitle={subtitle}
        onBack={() => router.back()}
      />

      {screen.loading && screen.groupTotal === 0 ? (
        <LoadingState message={t("requests.loading")} />
      ) : showFullError ? (
        <ErrorState
          title={t("errorTitle")}
          message={screen.error ?? ""}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("retryAccessibility")}
          onRetry={screen.reload}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.routeScrollContent}
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
          <ErrorBanner message={screen.actionError} />

          {showEmpty ? (
            <EmptyState
              title={t("requests.emptyTitle")}
              message={t("requests.emptyMessage")}
              variant="card"
            />
          ) : (
            <>
              <FriendRequestSection
                title={t("friends:requests.incomingTitle")}
                requests={screen.incoming}
                pendingId={screen.pendingId}
                onAccept={screen.acceptRequest}
                onReject={screen.rejectRequest}
                onCancel={screen.cancelRequest}
              />
              <GroupInvitationsSection
                invitations={screen.groupInvitations}
                loading={screen.groupsLoading}
                error={screen.groupError}
                actionError={screen.groupActionError}
                pendingId={screen.groupPendingId}
                pendingAction={screen.groupPendingAction}
                onAccept={screen.acceptInvitation}
                onReject={screen.rejectInvitation}
                onRetry={screen.reloadGroups}
              />
              <FriendRequestSection
                title={t("friends:requests.outgoingTitle")}
                requests={screen.outgoing}
                pendingId={screen.pendingId}
                onAccept={screen.acceptRequest}
                onReject={screen.rejectRequest}
                onCancel={screen.cancelRequest}
              />
            </>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}
