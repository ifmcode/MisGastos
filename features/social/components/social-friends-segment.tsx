import { useTranslation } from "react-i18next";

import { FriendsList } from "@/features/friends/components/friends-list";
import type { Friend } from "@/features/friends/types/friend.types";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";

export interface SocialFriendsSegmentProps {
  friends: readonly Friend[];
  loading: boolean;
  /** Background failure with cached friends keeps the list plus the banner. */
  error: string | null;
  onOpen: (friend: Friend) => void;
  onRetry: () => void;
}

/** "Tus amigos" segment with its own loading, error and list states. */
export function SocialFriendsSegment({
  friends,
  loading,
  error,
  onOpen,
  onRetry,
}: SocialFriendsSegmentProps) {
  const { t } = useTranslation(["social", "common"]);

  if (loading) {
    return <LoadingState variant="inline" message={t("loading")} />;
  }

  if (error && friends.length === 0) {
    return (
      <ErrorState
        variant="inline"
        message={error}
        retryLabel={t("common:actions.retry")}
        retryAccessibilityLabel={t("retryAccessibility")}
        onRetry={onRetry}
      />
    );
  }

  return <FriendsList friends={friends} onOpen={onOpen} />;
}
