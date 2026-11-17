import type {
  FabActionMenuAction,
  FabActionMenuIconName,
} from "@/shared/components/molecules/fab-action-menu";
import type { Translate } from "@/shared/i18n/translate";

export type MovementsFabActionKey =
  | "newMovement"
  | "friendExpense"
  | "groupExpense";

export interface MovementsFabAction {
  key: MovementsFabActionKey;
  label: string;
  icon: FabActionMenuIconName;
  hint?: string;
  disabled?: boolean;
}

export type MovementsFriendsState = "loading" | "error" | "none" | "ready";

export interface MovementsFabActionsOptions {
  friendsState: MovementsFriendsState;
}

export type MovementsFabActionHandlers = Record<
  MovementsFabActionKey,
  () => void
>;

/**
 * The three create entries of the movements tab, already translated. Group
 * expenses stay disabled until TICKET-008 lands; the friend entry is enabled
 * only once the accepted friends are loaded, so it never opens a dead form.
 * Only a confirmed empty list points to Social: a loading or failed overview
 * keeps the neutral action hint instead of claiming there are no friends.
 */
export function getMovementsFabActions(
  t: Translate,
  { friendsState }: MovementsFabActionsOptions,
): MovementsFabAction[] {
  return [
    {
      key: "newMovement",
      label: t("fab.newMovement"),
      icon: "add-circle-outline",
      hint: t("fab.newMovementHint"),
    },
    {
      key: "friendExpense",
      label: t("fab.friendExpense"),
      icon: "people-outline",
      hint:
        friendsState === "none"
          ? t("fab.friendExpenseNoFriendsHint")
          : t("fab.friendExpenseHint"),
      disabled: friendsState !== "ready",
    },
    {
      key: "groupExpense",
      label: t("fab.groupExpense"),
      icon: "people-circle-outline",
      hint: t("fab.groupExpenseComingSoonHint"),
      disabled: true,
    },
  ];
}

/**
 * Binds each action to its handler. The guard is defensive: the menu row is
 * already disabled, but a disabled action must never run its handler even if
 * the row is pressed by a platform quirk.
 */
export function getMovementsFabMenuActions(
  actions: readonly MovementsFabAction[],
  handlers: MovementsFabActionHandlers,
): FabActionMenuAction[] {
  return actions.map((action) => ({
    key: action.key,
    label: action.label,
    icon: action.icon,
    hint: action.hint,
    disabled: action.disabled,
    onPress: () => {
      if (action.disabled) return;
      handlers[action.key]();
    },
  }));
}
