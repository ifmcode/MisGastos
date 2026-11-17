import { useCallback, useMemo, useState } from "react";

import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import type { Friend } from "@/features/friends/types/friend.types";
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
  friends: Friend[];
  openMenu: () => void;
  closeMenu: () => void;
}

/**
 * Composition root of the movements create menu: the menu visibility, the
 * three actions and the shared-expense editor mounted by the same screen.
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
  const [menuVisible, setMenuVisible] = useState(false);
  const { tr } = useScopedTranslation("transactions");

  const friends = overview.overview.friends;

  const editor = useSharedExpenseEditor({
    viewerUid,
    friends,
    preferredCurrency,
    preselectFirstFriend: false,
    onSaved: onChanged,
  });

  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  // Cached friends win over a failed background refresh: a friend list already
  // loaded must not disable the action just because refreshing it failed.
  const friendsState: MovementsFriendsState =
    friends.length > 0
      ? "ready"
      : overview.loading
        ? "loading"
        : overview.error
          ? "error"
          : "none";

  const actions = useMemo(
    () =>
      getMovementsFabMenuActions(
        getMovementsFabActions(tr, { friendsState }),
        {
          newMovement: openMovementForm,
          friendExpense: editor.openCreate,
          groupExpense: () => undefined,
        },
      ),
    [
      editor.openCreate,
      friendsState,
      openMovementForm,
      overview.error,
      overview.loading,
      tr,
    ],
  );

  return {
    menuVisible,
    actions,
    editor,
    friends,
    openMenu,
    closeMenu,
  };
}
