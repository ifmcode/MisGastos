import { useCallback } from "react";

import type { CurrencyCode } from "@/shared/constants/currencies";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import {
  useConfirmDialog,
  type UseConfirmDialogResult,
} from "@/shared/hooks/use-confirm-dialog";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { Friend, FriendRequestItem } from "../types/friend.types";
import { getFriendDisplayName } from "../utils/friend-display";
import { useFriendActions } from "./use-friend-actions";
import {
  useFriendSearch,
  type FriendSearchController,
} from "./use-friend-search";
import { useFriendsOverview } from "./use-friends-overview";

export interface FriendsScreenController {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  friends: Friend[];
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
  search: FriendSearchController;
  pendingId: string | null;
  actionError: string | null;
  confirm: UseConfirmDialogResult;
  preferredCurrency: CurrencyCode;
  reload: () => void;
  refresh: () => void;
  acceptRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  cancelRequest: (requestId: string) => void;
  sendRequestToResult: (recipientUid: string) => Promise<void>;
  requestRemove: (friend: Friend) => void;
}

/** Composition root of the friends screen; owns the remove confirmation. */
export function useFriendsScreen(): FriendsScreenController {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t } = useScopedTranslation("friends");
  const viewerUid = user?.uid;
  const { overview, loading, refreshing, error, reload, refresh } =
    useFriendsOverview({ viewerUid });
  const actions = useFriendActions({ viewerUid, onChanged: refresh });
  const search = useFriendSearch({ viewerUid });
  const confirm = useConfirmDialog();

  const { open: openConfirm } = confirm;
  const { removeFriend, sendRequest } = actions;
  const { markRelation } = search;

  const requestRemove = useCallback(
    (friend: Friend) => {
      openConfirm({
        title: t("removeDialog.title"),
        message: t("removeDialog.message", {
          name: getFriendDisplayName(friend),
        }),
        confirmLabel: t("removeDialog.confirm"),
        cancelLabel: t("removeDialog.cancel"),
        onConfirm: () => {
          void removeFriend(friend.uid);
        },
      });
    },
    [openConfirm, removeFriend, t],
  );

  const sendRequestToResult = useCallback(
    async (recipientUid: string) => {
      const request = await sendRequest(recipientUid);

      if (request) markRelation("outgoing", request.id);
    },
    [sendRequest, markRelation],
  );

  const acceptRequest = useCallback(
    (requestId: string) => {
      void actions.acceptRequest(requestId);
    },
    [actions.acceptRequest],
  );

  const rejectRequest = useCallback(
    (requestId: string) => {
      void actions.rejectRequest(requestId);
    },
    [actions.rejectRequest],
  );

  const cancelRequest = useCallback(
    (requestId: string) => {
      void actions.cancelRequest(requestId);
    },
    [actions.cancelRequest],
  );

  return {
    loading,
    refreshing,
    error,
    friends: overview.friends,
    incoming: overview.incoming,
    outgoing: overview.outgoing,
    search,
    pendingId: actions.pendingId,
    actionError: actions.error,
    confirm,
    preferredCurrency: profile?.preferredCurrency ?? "EUR",
    reload: () => {
      void reload();
    },
    refresh: () => {
      void refresh();
    },
    acceptRequest,
    rejectRequest,
    cancelRequest,
    sendRequestToResult,
    requestRemove,
  };
}
