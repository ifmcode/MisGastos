import { useCallback, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode } from "../services/group.errors";
import type { GroupJoinRequestItem } from "../types/group-join.types";
import { useGroupsService } from "./use-groups-service";

export type GroupJoinDecision = "accepted" | "rejected";

export interface UseGroupJoinRequestsOptions {
  viewerUid: string | undefined;
  groupId: string;
  /** Pending requests already resolved by the group detail. */
  requests: readonly GroupJoinRequestItem[];
  /** Reloads the detail after a decision, dropping the answered row. */
  onChanged: () => void;
}

export interface GroupJoinRequestsController {
  requests: readonly GroupJoinRequestItem[];
  pendingId: string | null;
  pendingDecision: GroupJoinDecision | null;
  error: string | null;
  respond: (requestId: string, decision: GroupJoinDecision) => void;
}

/** Single-flight owner accept/reject of the pending join requests. */
export function useGroupJoinRequests({
  viewerUid,
  groupId,
  requests,
  onChanged,
}: UseGroupJoinRequestsOptions): GroupJoinRequestsController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] =
    useState<GroupJoinDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const respond = useCallback(
    (requestId: string, decision: GroupJoinDecision) => {
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
        .then(() => onChanged())
        .catch((respondError: unknown) => {
          const mapped = getGroupErrorCode(respondError, "SAVE_FAILED");
          setError(tr(`errors.${mapped}`));
        })
        .finally(() => {
          inFlightRef.current = false;
          setPendingId(null);
          setPendingDecision(null);
        });
    },
    [groupId, onChanged, service, tr, viewerUid],
  );

  return { requests, pendingId, pendingDecision, error, respond };
}
