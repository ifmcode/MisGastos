import { useCallback, useRef, useState } from "react";

import type { GroupMember } from "@/features/groups/types/group.types";
import { useGroupsService } from "@/features/groups/hooks/use-groups-service";
import { getGroupErrorCode } from "@/features/groups/services/group.errors";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

export interface UseGroupExpenseMembersOptions {
  viewerUid: string | undefined;
}

export interface GroupExpenseMembersController {
  members: GroupMember[];
  loading: boolean;
  error: string | null;
  /** Loads the active members of the group; a blank id just clears the state. */
  load: (groupId: string) => void;
  reset: () => void;
}

/**
 * Member list of the group picked in the form. The group detail entry point
 * already carries `members`, so the editor only uses this when it needs them.
 */
export function useGroupExpenseMembers({
  viewerUid,
}: UseGroupExpenseMembersOptions): GroupExpenseMembersController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groupExpenses");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const reset = useCallback(() => {
    requestRef.current += 1;
    setMembers([]);
    setLoading(false);
    setError(null);
  }, []);

  const load = useCallback(
    (groupId: string) => {
      if (!viewerUid || !groupId) {
        reset();
        return;
      }

      requestRef.current += 1;
      const request = requestRef.current;
      setLoading(true);
      setError(null);

      const run = async () => {
        try {
          const detail = await service.getGroupDetail(viewerUid, groupId);
          if (requestRef.current === request) setMembers(detail.members);
        } catch (loadError: unknown) {
          if (requestRef.current === request) {
            setError(
              tr(`errors.${getGroupErrorCode(loadError, "LOAD_FAILED")}`),
            );
          }
        } finally {
          if (requestRef.current === request) setLoading(false);
        }
      };

      void run();
    },
    [reset, service, tr, viewerUid],
  );

  return { members, loading, error, load, reset };
}
