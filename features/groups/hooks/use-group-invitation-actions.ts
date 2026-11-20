import { useCallback, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode } from "../services/group.errors";
import { useGroupsService } from "./use-groups-service";

export type GroupInvitationResponse = "accept" | "reject";

export interface UseGroupInvitationActionsOptions {
  viewerUid: string | undefined;
  /** Drops the answered row and refreshes the sources. */
  onResponded: (invitationId: string) => void;
}

export interface GroupInvitationActionsController {
  pendingId: string | null;
  pendingAction: GroupInvitationResponse | null;
  error: string | null;
  accept: (invitationId: string) => void;
  reject: (invitationId: string) => void;
}

/** Single-flight accept/reject of the received group invitations. */
export function useGroupInvitationActions({
  viewerUid,
  onResponded,
}: UseGroupInvitationActionsOptions): GroupInvitationActionsController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] =
    useState<GroupInvitationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const respond = useCallback(
    (
      invitationId: string,
      action: GroupInvitationResponse,
    ) => {
      if (!viewerUid) {
        setError(tr("errors.SIGN_IN_REQUIRED"));
        return;
      }

      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setPendingId(invitationId);
      setPendingAction(action);
      setError(null);

      const operation =
        action === "accept"
          ? service.acceptInvitation(viewerUid, invitationId)
          : service.rejectInvitation(viewerUid, invitationId);

      void operation
        .then(() => {
          onResponded(invitationId);
        })
        .catch((actionError: unknown) => {
          setError(tr(`errors.${getGroupErrorCode(actionError, "SAVE_FAILED")}`));
        })
        .finally(() => {
          inFlightRef.current = false;
          setPendingId(null);
          setPendingAction(null);
        });
    },
    [onResponded, service, tr, viewerUid],
  );

  const accept = useCallback(
    (invitationId: string) => respond(invitationId, "accept"),
    [respond],
  );

  const reject = useCallback(
    (invitationId: string) => respond(invitationId, "reject"),
    [respond],
  );

  return { pendingId, pendingAction, error, accept, reject };
}
