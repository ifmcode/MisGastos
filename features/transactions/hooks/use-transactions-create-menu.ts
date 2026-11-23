import { useCallback, useMemo, useState } from "react";

import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import type { Friend } from "@/features/friends/types/friend.types";
import { useGroupExpenseEditor } from "@/features/group-expenses/hooks/use-group-expense-editor";
import type { GroupExpenseEditorController } from "@/features/group-expenses/hooks/use-group-expense-editor";
import { useGroups } from "@/features/groups/hooks/use-groups";
import { useProfile } from "@/features/profile/hooks/use-profile";
import {
  useSharedExpenseEditor,
  type SharedExpenseEditorController,
} from "@/features/shared-expenses/hooks/use-shared-expense-editor";
import { useAuth } from "@/hooks/use-auth";
import type { FabActionMenuAction } from "@/shared/components/molecules/fab-action-menu";
import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import {
  getMovementsFabActions,
  getMovementsFabMenuActions,
  type MovementsFriendsState,
  type MovementsGroupsState,
} from "../utils/movements-fab-actions";

export interface UseTransactionsCreateMenuOptions {
  openMovementForm: () => void;
  /** Movements and wallet refresh owned by the screen hook. */
  onChanged: () => void;
}

export interface TransactionsCreateMenuController {
  menuVisible: boolean;
  actions: FabActionMenuAction[];
  editor: SharedExpenseEditorController;
  groupExpenseEditor: GroupExpenseEditorController;
  friends: Friend[];
  openMenu: () => void;
  closeMenu: () => void;
}

/**
 * Composition root of the movements create menu: the menu visibility, the three
 * actions and the shared and group expense editors mounted by the same screen.
 */
export function useTransactionsCreateMenu({
  openMovementForm,
  onChanged,
}: UseTransactionsCreateMenuOptions): TransactionsCreateMenuController {
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const { profile } = useProfile();
  const preferredCurrency = profile?.preferredCurrency ?? DEFAULT_CURRENCY;
  const overview = useFriendsOverview({ viewerUid });
  const groupsOverview = useGroups({ viewerUid });
  const [menuVisible, setMenuVisible] = useState(false);
  const { tr } = useScopedTranslation("transactions");

  const friends = overview.overview.friends;
  const groups = groupsOverview.groups;

  const editor = useSharedExpenseEditor({
    viewerUid,
    friends,
    preferredCurrency,
    preselectFirstFriend: false,
    registerInWalletByDefault:
      profile?.registerSharedExpensesInWallet ?? false,
    onSaved: onChanged,
  });

  const groupExpenseEditor = useGroupExpenseEditor({
    viewerUid,
    groups,
    preferredCurrency,
    registerInWalletByDefault:
      profile?.registerSharedExpensesInWallet ?? false,
    onSaved: onChanged,
  });
  const { openGroupPicker } = groupExpenseEditor;

  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  // Cached lists win over a failed background refresh: data already loaded must
  // not disable an action just because refreshing it failed.
  const friendsState: MovementsFriendsState =
    friends.length > 0
      ? "ready"
      : overview.loading
        ? "loading"
        : overview.error
          ? "error"
          : "none";
  const groupsState: MovementsGroupsState =
    groups.length > 0
      ? "ready"
      : groupsOverview.loading
        ? "loading"
        : groupsOverview.error
          ? "error"
          : "none";

  const actions = useMemo(
    () =>
      getMovementsFabMenuActions(
        getMovementsFabActions(tr, { friendsState, groupsState }),
        {
          newMovement: openMovementForm,
          friendExpense: editor.openCreate,
          // The picker opens first: picking a group is what brings the form up.
          groupExpense: openGroupPicker,
        },
      ),
    [
      editor.openCreate,
      friendsState,
      groupsState,
      openGroupPicker,
      openMovementForm,
      tr,
    ],
  );

  return {
    menuVisible,
    actions,
    editor,
    groupExpenseEditor,
    friends,
    openMenu,
    closeMenu,
  };
}
