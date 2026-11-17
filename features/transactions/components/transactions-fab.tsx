import { Fab } from "@/shared/components/molecules/fab";
import {
  FabActionMenu,
  type FabActionMenuAction,
} from "@/shared/components/molecules/fab-action-menu";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

export interface TransactionsFabProps {
  bottom: number;
  menuVisible: boolean;
  actions: readonly FabActionMenuAction[];
  onOpen: () => void;
  onClose: () => void;
}

/** FAB plus the create menu: the only create entry point of the movements tab. */
export function TransactionsFab({
  bottom,
  menuVisible,
  actions,
  onOpen,
  onClose,
}: TransactionsFabProps) {
  const { t } = useScopedTranslation("transactions");

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
        actions={actions}
      />
    </>
  );
}
