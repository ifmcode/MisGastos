import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import type { Friend } from "@/features/friends/types/friend.types";
import { GroupFormModal } from "@/features/groups/components/group-form-modal";
import type { Group } from "@/features/groups/types/group.types";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";

import { useSocialScreen } from "../hooks/use-social-screen";
import { socialStyles as styles } from "../styles/social.styles";
import { SocialFab } from "./social-fab";
import { SocialFriendsSegment } from "./social-friends-segment";
import { SocialGroupsSegment } from "./social-groups-segment";
import { SocialHeader } from "./social-header";
import { SocialSegmentControl } from "./social-segment-control";

/**
 * Social hub: header with the requests entry point, the friends/groups segments
 * and the action menu.
 */
export function SocialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const screen = useSocialScreen();
  const { editor } = screen;
  const friendsFailed = !!screen.error && screen.friends.length === 0;
  // Cached friends with a background error still allow creation.
  const canCreate = screen.friends.length > 0 && !screen.friendsLoading;
  const openFriend = useCallback(
    (friend: Friend) => {
      router.push(`/social/friends/${friend.uid}` as Href);
    },
    [router],
  );

  const openGroup = useCallback(
    (group: Group) => {
      router.push(`/social/groups/${group.id}` as Href);
    },
    [router],
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <SocialHeader
        pendingCount={screen.pendingCount}
        onOpenRequests={() => router.push("/social/requests" as Href)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {friendsFailed ? null : <ErrorBanner message={screen.error} />}

        <SocialSegmentControl
          value={screen.segment}
          onChange={screen.setSegment}
        />

        {screen.segment === "friends" ? (
          <SocialFriendsSegment
            friends={screen.friends}
            loading={screen.friendsLoading}
            error={screen.error}
            onOpen={openFriend}
            onRetry={screen.reload}
          />
        ) : (
          <SocialGroupsSegment
            groups={screen.groups.groups}
            balanceSummaries={screen.groups.balanceSummaries}
            loading={screen.groups.loading}
            error={screen.groups.error}
            viewerUid={screen.viewerUid}
            canCreate={canCreate}
            onCreate={editor.openCreate}
            onOpen={openGroup}
            onEdit={editor.openEdit}
            onRetry={screen.groups.reload}
          />
        )}
      </ScrollView>

      <SocialFab
        menuVisible={screen.menuVisible}
        bottom={insets.bottom + 24}
        friendsLoading={screen.friendsLoading}
        friendsFailed={friendsFailed}
        hasFriends={screen.friends.length > 0}
        onOpen={screen.openMenu}
        onClose={screen.closeMenu}
        onAddFriend={() => router.push("/social/add-friend" as Href)}
        onJoinGroup={() => router.push("/social/groups/join" as Href)}
        onCreateGroup={editor.openCreate}
      />

      <GroupFormModal
        visible={editor.formVisible}
        isEditing={editor.editingGroup !== null}
        initialValues={editor.initialValues}
        friends={screen.friends}
        fieldErrors={editor.fieldErrors}
        error={editor.formError}
        submitting={editor.submitting}
        onSubmit={editor.submit}
        onClose={editor.closeForm}
      />
    </ThemedView>
  );
}
