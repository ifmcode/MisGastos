import { useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useSocialScreen } from "../hooks/use-social-screen";
import { socialStyles as styles } from "../styles/social.styles";
import { SocialFab } from "./social-fab";
import { SocialFriendsSegment } from "./social-friends-segment";
import { SocialGroupsSegment } from "./social-groups-segment";
import { SocialHeader } from "./social-header";
import { SocialPendingRow } from "./social-pending-row";
import { SocialSegmentControl } from "./social-segment-control";

/** Social hub: pending row, friends/groups segments and the add menu. */
export function SocialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useFormTheme();
  const { t } = useTranslation(["social", "common"]);
  const screen = useSocialScreen();
  const hasData = screen.friends.length > 0 || screen.pendingCount > 0;
  const showFullError = !!screen.error && !hasData;
  const loaded = !screen.loading && !showFullError;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <SocialHeader />

      {screen.loading ? (
        <LoadingState message={t("loading")} />
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
          <ErrorBanner message={screen.actionError} />

          <SocialPendingRow
            count={screen.pendingCount}
            onPress={() => router.push("/social/requests" as Href)}
          />

          <SocialSegmentControl
            value={screen.segment}
            onChange={screen.setSegment}
          />

          {screen.segment === "friends" ? (
            <SocialFriendsSegment
              friends={screen.friends}
              pendingId={screen.pendingId}
              onRemove={screen.requestRemove}
            />
          ) : (
            <SocialGroupsSegment />
          )}
        </ScrollView>
      )}

      {loaded ? (
        <SocialFab
          menuVisible={screen.menuVisible}
          bottom={insets.bottom + 24}
          onOpen={screen.openMenu}
          onClose={screen.closeMenu}
          onAddFriend={() => router.push("/social/add-friend" as Href)}
        />
      ) : null}

      <ConfirmDialog
        visible={screen.confirm.visible}
        title={screen.confirm.title}
        message={screen.confirm.message}
        confirmLabel={screen.confirm.confirmLabel}
        cancelLabel={screen.confirm.cancelLabel}
        onConfirm={screen.confirm.confirm}
        onCancel={screen.confirm.close}
      />
    </ThemedView>
  );
}
