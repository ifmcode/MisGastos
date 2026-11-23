import { useCallback, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode } from "../services/group.errors";
import { useGroupsService } from "./use-groups-service";

export type GroupJoinDecision = "accepted" | "rejected";

export interface UseOwnerJoinRequestActionsOptions {
  viewerUid: string | undefined;
  /** Drops the answered row from the queue. */
  onResolved: (groupId: string, requestId: string) => void;
  /** Refreshes the groups overview after a decision. */
  onResponded?: () => void;
}

export interface GroupJoinRequestActionsController {
  pendingId: string | null;
  pendingDecision: GroupJoinDecision | null;
  error: string | null;
  respond: (
    groupId: string,
    requestId: string,
    decision: GroupJoinDecision,
  ) => void;
}

/** Single-flight owner accept/reject of one pending join request. */
export function useOwnerJoinRequestActions({
  viewerUid,
  onResolved,
  onResponded,
}: UseOwnerJoinRequestActionsOptions): GroupJoinRequestActionsController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] =
    useState<GroupJoinDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const respond = useCallback(
    (groupId: string, requestId: string, decision: GroupJoinDecision) => {
      if (!viewerUid) {
        setError(tr("errors.SIGN_IN_REQUIRED"));
        return;
      }

      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setPendingId(requestId);
      setPendingDecision(decision);
      setError(null);

      void service
        .respondToJoinRequest(viewerUid, groupId, requestId, decision)
        .then(() => {
          onResolved(groupId, requestId);
          onResponded?.();
        })
        .catch((respondError: unknown) => {
          const code = getGroupErrorCode(respondError, "SAVE_FAILED");
          setError(tr(`errors.${code}`));
        })
        .finally(() => {
          inFlightRef.current = false;
          setPendingId(null);
          setPendingDecision(null);
        });
    },
    [onResolved, onResponded, service, tr, viewerUid],
  );

  return { pendingId, pendingDecision, error, respond };
}
