import { useCallback } from "react";

import { useFriendActions } from "@/features/friends/hooks/use-friend-actions";
import {
  useFriendSearch,
  type FriendSearchController,
} from "@/features/friends/hooks/use-friend-search";
import { useAuth } from "@/hooks/use-auth";

const noop = () => {};

export interface UseAddFriendScreenOptions {
  /** Lets the Social tab refresh its pending count after a successful send. */
  onRequestSent?: () => void;
}

export interface AddFriendScreenController {
  search: FriendSearchController;
  pendingId: string | null;
  actionError: string | null;
  sendToResult: (recipientUid: string) => Promise<void>;
  retrySearch: () => void;
}

/** Composition of the existing search hook and the shared friend actions. */
export function useAddFriendScreen(
  options: UseAddFriendScreenOptions = {},
): AddFriendScreenController {
  const { onRequestSent } = options;
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const search = useFriendSearch({ viewerUid });
  const actions = useFriendActions({
    viewerUid,
    onChanged: onRequestSent ?? noop,
  });

  const { markRelation, search: runSearch } = search;
  const { sendRequest } = actions;

  const sendToResult = useCallback(
    async (recipientUid: string) => {
      const request = await sendRequest(recipientUid);

      if (request) markRelation("outgoing", request.id);
    },
    [sendRequest, markRelation],
  );

  const retrySearch = useCallback(() => {
    void runSearch();
  }, [runSearch]);

  return {
    search,
    pendingId: actions.pendingId,
    actionError: actions.error,
    sendToResult,
    retrySearch,
  };
}
