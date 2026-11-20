import { useCallback, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode, GroupValidationError } from "../services/group.errors";
import { useGroupsService } from "./use-groups-service";

export interface UseGroupInviteSubmitOptions {
  viewerUid: string | undefined;
  /** Target group; empty when the detail is not loaded yet. */
  groupId: string;
  selectedIds: readonly string[];
  capacity: number;
  /** Closes the sheet and refreshes the detail after a successful invite. */
  onSent: () => void;
}

export interface GroupInviteSubmitState {
  submitting: boolean;
  error: string | null;
  resetError: () => void;
  submit: () => void;
}

/** Validates and persists one invitation round of the group detail. */
export function useGroupInviteSubmit({
  viewerUid,
  groupId,
  selectedIds,
  capacity,
  onSent,
}: UseGroupInviteSubmitOptions): GroupInviteSubmitState {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => setError(null), []);

  const submit = useCallback(() => {
    if (!viewerUid) {
      setError(tr("errors.SIGN_IN_REQUIRED"));
      return;
    }

    if (!groupId) return;

    if (selectedIds.length === 0) {
      setError(tr("errors.INVITEES_REQUIRED"));
      return;
    }

    if (selectedIds.length > capacity) {
      setError(tr("errors.INVITEES_TOO_MANY"));
      return;
    }

    const persist = async () => {
      setSubmitting(true);
      setError(null);

      try {
        await service.inviteMembers(viewerUid, groupId, selectedIds);
        onSent();
      } catch (inviteError: unknown) {
        if (inviteError instanceof GroupValidationError) {
          const code = inviteError.fieldErrors.inviteeIds;
          if (code) {
            setError(tr(`errors.${code}`));
            return;
          }
        }

        setError(
          tr(`errors.${getGroupErrorCode(inviteError, "SAVE_FAILED")}`),
        );
      } finally {
        setSubmitting(false);
      }
    };

    void persist();
  }, [capacity, groupId, onSent, selectedIds, service, tr, viewerUid]);

  return { submitting, error, resetError, submit };
}
