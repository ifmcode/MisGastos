import { useCallback, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import {
  getFriendErrorCode,
  type FriendErrorCode,
} from "../services/friend.errors";
import type { FriendRequest, Friendship } from "../types/friend.types";
import { useFriendsService } from "./use-friends-service";

export interface UseFriendActionsOptions {
  viewerUid: string | undefined;
  /** Reloads the overview after every successful mutation. */
  onChanged: () => void | Promise<void>;
}

export interface FriendActionsController {
  /** Id of the row or profile with an operation in flight. */
  pendingId: string | null;
  error: string | null;
  sendRequest: (recipientUid: string) => Promise<FriendRequest | null>;
  acceptRequest: (requestId: string) => Promise<boolean>;
  rejectRequest: (requestId: string) => Promise<boolean>;
  cancelRequest: (requestId: string) => Promise<boolean>;
  removeFriend: (friendUid: string) => Promise<boolean>;
}

type FailureCode = Exclude<FriendErrorCode, "VALIDATION">;

/** Single-flight friend mutations behind one pending id and one error. */
export function useFriendActions({
  viewerUid,
  onChanged,
}: UseFriendActionsOptions): FriendActionsController {
  const service = useFriendsService();
  const { tr } = useScopedTranslation("friends");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const run = useCallback(
    async <T>(
      id: string,
      signInKey: string,
      fallback: FailureCode,
      operation: (viewer: string) => Promise<T>,
    ): Promise<T | null> => {
      if (inFlightRef.current) return null;

      if (!viewerUid) {
        setError(tr(signInKey));
        return null;
      }

      inFlightRef.current = true;
      setPendingId(id);
      setError(null);

      try {
        const result = await operation(viewerUid);
        await onChanged();
        return result;
      } catch (actionError: unknown) {
        setError(tr(`errors.${getFriendErrorCode(actionError, fallback)}`));
        return null;
      } finally {
        inFlightRef.current = false;
        setPendingId(null);
      }
    },
    [viewerUid, onChanged, tr],
  );

  const sendRequest = useCallback(
    (recipientUid: string) =>
      run(recipientUid, "errors.SIGN_IN_SEND", "SEND_FAILED", (viewer) =>
        service.sendRequest(viewer, recipientUid),
      ),
    [run, service],
  );

  const respond = useCallback(
    (
      requestId: string,
      operation: (viewer: string, id: string) => Promise<unknown>,
    ) => run(requestId, "errors.SIGN_IN_RESPOND", "RESPOND_FAILED", (viewer) =>
      operation(viewer, requestId),
    ),
    [run],
  );

  const acceptRequest = useCallback(
    async (requestId: string) =>
      (await respond(requestId, (viewer, id): Promise<Friendship> =>
        service.acceptRequest(viewer, id),
      )) !== null,
    [respond, service],
  );

  const rejectRequest = useCallback(
    async (requestId: string) =>
      (await respond(requestId, (viewer, id) =>
        service.rejectRequest(viewer, id),
      )) !== null,
    [respond, service],
  );

  const cancelRequest = useCallback(
    async (requestId: string) =>
      (await respond(requestId, (viewer, id) =>
        service.cancelRequest(viewer, id),
      )) !== null,
    [respond, service],
  );

  const removeFriend = useCallback(
    async (friendUid: string) =>
      (await run(friendUid, "errors.SIGN_IN_REMOVE", "REMOVE_FAILED", (viewer) =>
        service.removeFriend(viewer, friendUid),
      )) !== null,
    [run, service],
  );

  return {
    pendingId,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
  };
}
