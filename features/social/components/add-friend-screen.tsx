import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { FriendSearchEmpty } from "@/features/friends/components/friend-search-empty";
import { FriendSearchForm } from "@/features/friends/components/friend-search-form";
import { FriendSearchResult } from "@/features/friends/components/friend-search-result";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";

import { useAddFriendScreen } from "../hooks/use-add-friend-screen";
import { socialStyles as styles } from "../styles/social.styles";
import { SocialRouteHeader } from "./social-route-header";

export interface AddFriendScreenProps {
  /** Notifies the Social tab that an outgoing request was created. */
  onRequestSent?: () => void;
}

/** Exact-email search and request sending, composed from the friends feature. */
export function AddFriendScreen({ onRequestSent }: AddFriendScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(["social", "common"]);
  const screen = useAddFriendScreen({ onRequestSent });
  const { search } = screen;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <SocialRouteHeader
        title={t("addFriend.title")}
        subtitle={t("addFriend.subtitle")}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.routeScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FriendSearchForm
          email={search.email}
          fieldError={search.fieldError}
          searching={search.searching}
          onChangeEmail={search.setEmail}
          onSubmit={() => void search.search()}
        />

        {search.error ? (
          <ErrorState
            variant="inline"
            message={search.error}
            retryLabel={t("common:actions.retry")}
            retryAccessibilityLabel={t("addFriend.retrySearchAccessibility")}
            onRetry={screen.retrySearch}
          />
        ) : null}

        {search.status === "not-found" ? <FriendSearchEmpty /> : null}

        {search.status === "found" && search.result ? (
          <FriendSearchResult
            result={search.result}
            pendingId={screen.pendingId}
            onSend={(recipientUid) => void screen.sendToResult(recipientUid)}
          />
        ) : null}

        <ErrorBanner message={screen.actionError} />
      </ScrollView>
    </ThemedView>
  );
}
