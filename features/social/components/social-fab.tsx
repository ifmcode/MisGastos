import { Fab } from "@/shared/components/molecules/fab";
import { FabActionMenu } from "@/shared/components/molecules/fab-action-menu";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

export interface SocialFabProps {
  menuVisible: boolean;
  bottom: number;
  onOpen: () => void;
  onClose: () => void;
  onAddFriend: () => void;
}

/** FAB plus its single-action menu; group actions arrive in Phase 6. */
export function SocialFab({
  menuVisible,
  bottom,
  onOpen,
  onClose,
  onAddFriend,
}: SocialFabProps) {
  const { t } = useScopedTranslation("social");

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
