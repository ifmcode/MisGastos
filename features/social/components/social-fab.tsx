import { Fab } from "@/shared/components/molecules/fab";
import { FabActionMenu } from "@/shared/components/molecules/fab-action-menu";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

export interface SocialFabProps {
  menuVisible: boolean;
  bottom: number;
  /** Friends overview still loading: creating a group has no invitee list. */
  friendsLoading: boolean;
  /** Friends overview failed with no cached friends. */
  friendsFailed: boolean;
  hasFriends: boolean;
  onOpen: () => void;
  onClose: () => void;
  onAddFriend: () => void;
  onJoinGroup: () => void;
  onCreateGroup: () => void;
}

/** FAB plus its menu: join or create a group and add a friend. */
export function SocialFab({
  menuVisible,
  bottom,
  friendsLoading,
  friendsFailed,
  hasFriends,
  onOpen,
  onClose,
  onAddFriend,
  onJoinGroup,
  onCreateGroup,
}: SocialFabProps) {
  const { t } = useScopedTranslation("social");
  const createGroupDisabled = friendsLoading || !hasFriends;
  const createGroupHint = friendsLoading
    ? t("fab.createGroupLoadingHint")
    : friendsFailed
      ? t("fab.createGroupErrorHint")
      : hasFriends
        ? t("fab.createGroupHint")
        : t("fab.createGroupDisabledHint");

  return (
    <>
      <Fab
        accessibilityLabel={t("fab.openAccessibility")}
        accessibilityHint={t("fab.openHint")}
        bottom={bottom}
        onPress={onOpen}
      />
      <FabActionMenu
        visible={menuVisible}
        title={t("fab.menuTitle")}
        onClose={onClose}
        actions={[
          {
            key: "create-group",
            label: t("fab.createGroup"),
            icon: "people-outline",
            hint: createGroupHint,
            disabled: createGroupDisabled,
            onPress: onCreateGroup,
          },
          {
            key: "join-group",
            label: t("fab.joinGroup"),
            icon: "enter-outline",
            hint: t("fab.joinGroupHint"),
            onPress: onJoinGroup,
          },
          {
            key: "add-friend",
            label: t("fab.addFriend"),
            icon: "person-add-outline",
            hint: t("fab.addFriendHint"),
            onPress: onAddFriend,
          },
        ]}
      />
    </>
  );
}
