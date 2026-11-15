import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useFriendsScreen } from "../hooks/use-friends-screen";
import { friendsStyles as styles } from "../styles/friends.styles";
import { FriendRequestSection } from "./friend-request-section";
import { FriendSearchEmpty } from "./friend-search-empty";
import { FriendSearchForm } from "./friend-search-form";
import { FriendSearchResult } from "./friend-search-result";
import { FriendsHeader } from "./friends-header";
import { FriendsList } from "./friends-list";

export function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useFormTheme();
  const { t } = useTranslation(["friends", "common"]);
  const screen = useFriendsScreen();
  const { search } = screen;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <FriendsHeader />

      {screen.loading ? (
        <LoadingState message={t("loading")} />
      ) : screen.error ? (
        <ErrorState
          title={t("errorTitle")}
          message={screen.error}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("retryAccessibility")}
          onRetry={screen.reload}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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
          <FriendSearchForm
            email={search.email}
            fieldError={search.fieldError}
            searching={search.searching}
            onChangeEmail={search.setEmail}
            onSubmit={() => void search.search()}
          />

          <ErrorBanner message={search.error} />

          {search.status === "not-found" ? <FriendSearchEmpty /> : null}
          {search.status === "found" && search.result ? (
            <FriendSearchResult
              result={search.result}
              pendingId={screen.pendingId}
              onSend={(recipientUid) => void screen.sendRequestToResult(recipientUid)}
            />
          ) : null}

          <FriendRequestSection
            title={t("requests.incomingTitle")}
            requests={screen.incoming}
            pendingId={screen.pendingId}
            onAccept={screen.acceptRequest}
            onReject={screen.rejectRequest}
            onCancel={screen.cancelRequest}
          />

          <FriendRequestSection
            title={t("requests.outgoingTitle")}
            requests={screen.outgoing}
            pendingId={screen.pendingId}
            onAccept={screen.acceptRequest}
            onReject={screen.rejectRequest}
            onCancel={screen.cancelRequest}
          />

          <ErrorBanner message={screen.actionError} />

          <FriendsList
            friends={screen.friends}
            currency={screen.preferredCurrency}
            pendingId={screen.pendingId}
            onRemove={screen.requestRemove}
          />
        </ScrollView>
      )}

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
