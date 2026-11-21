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
export type MovementsGroupsState = "loading" | "error" | "none" | "ready";

export interface MovementsFabActionsOptions {
  friendsState: MovementsFriendsState;
  groupsState: MovementsGroupsState;
}

export type MovementsFabActionHandlers = Record<
  MovementsFabActionKey,
  () => void
>;

/**
 * The three create entries of the movements tab, already translated. Each
 * shared-expense entry is enabled only once its source list is loaded, so it
 * never opens a dead form. Only a confirmed empty list points to Social: a
 * loading or failed overview keeps the neutral action hint instead of claiming
 * there are no friends or groups.
 */
export function getMovementsFabActions(
  t: Translate,
  { friendsState, groupsState }: MovementsFabActionsOptions,
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
      hint:
        groupsState === "none"
          ? t("fab.groupExpenseNoGroupsHint")
          : t("fab.groupExpenseHint"),
      disabled: groupsState !== "ready",
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
