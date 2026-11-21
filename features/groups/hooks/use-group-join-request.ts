import { useCallback, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode } from "../services/group.errors";
import type { GroupJoinLookup } from "../types/group-join.types";
import { applyGroupJoinErrorToLookup } from "../utils/group-join-view";
import { useGroupsService } from "./use-groups-service";

export interface UseGroupJoinRequestOptions {
  viewerUid: string | undefined;
  /** Resolved group of the current lookup; `null` forbids sending. */
  lookup: GroupJoinLookup | null;
  /** Receives the lookup when the server state had already moved. */
  onLookupChanged: (next: GroupJoinLookup) => void;
  onSent: () => void;
}

export interface GroupJoinRequestController {
  sending: boolean;
  error: string | null;
  sendRequest: () => Promise<void>;
  clearError: () => void;
}

/**
 * Single-flight send of the join request. `ALREADY_MEMBER` and an already
 * pending request are state changes, not failures, so they update the lookup
 * instead of the banner; everything else keeps the mapped error.
 */
export function useGroupJoinRequest({
  viewerUid,
  lookup,
  onLookupChanged,
  onSent,
}: UseGroupJoinRequestOptions): GroupJoinRequestController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const sendRequest = useCallback(async () => {
    if (!lookup || inFlightRef.current) return;

    if (!viewerUid) {
      setError(tr("errors.SIGN_IN_REQUIRED"));
      return;
    }

    inFlightRef.current = true;
    setSending(true);
    setError(null);

    try {
      await service.requestToJoin(viewerUid, lookup.code);
      onSent();
    } catch (sendError: unknown) {
      const mapped = getGroupErrorCode(sendError, "SAVE_FAILED");

      // A second tab or device can create the same deterministic request first;
      // the denied write is really "already pending", so re-read the state.
      if (mapped === "PERMISSION_DENIED") {
        const refreshed = await service
          .lookupJoinCode(viewerUid, lookup.code)
          .catch(() => null);

        if (
          refreshed &&
          (refreshed.membership !== lookup.membership ||
            refreshed.requestStatus !== lookup.requestStatus)
        ) {
          onLookupChanged(refreshed);
          return;
        }
      }

      const next = applyGroupJoinErrorToLookup(lookup, mapped);

      if (next && next !== lookup) {
        onLookupChanged(next);
      } else {
        setError(tr(`errors.${mapped}`));
      }
    } finally {
      inFlightRef.current = false;
      setSending(false);
    }
  }, [lookup, onLookupChanged, onSent, service, tr, viewerUid]);

  return { sending, error, sendRequest, clearError };
}
