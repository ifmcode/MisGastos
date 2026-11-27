import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode } from "../services/group.errors";
import type { PendingGroupInvitationItem } from "../types/group.types";
import { useGroupsService } from "./use-groups-service";

type LoadMode = "initial" | "refresh";

export interface UseGroupInvitationsOptions {
  viewerUid: string | undefined;
}

export interface GroupInvitationsController {
  invitations: PendingGroupInvitationItem[];
  count: number;
  loading: boolean;
  error: string | null;
  /** Drops a row that was just accepted or rejected without a full reload. */
  removeInvitation: (invitationId: string) => void;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

/** Pending group invitations received by the viewer, newest first. */
export function useGroupInvitations({
  viewerUid,
}: UseGroupInvitationsOptions): GroupInvitationsController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const [invitations, setInvitations] = useState<PendingGroupInvitationItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid) {
        setInvitations([]);
        setError(null);
        setLoading(false);
        return;
      }

      requestRef.current += 1;
      const request = requestRef.current;
      const isInitialLoad = mode === "initial";

      if (isInitialLoad) setLoading(true);
      setError(null);

      try {
        const loaded = await service.getPendingInvitations(viewerUid);
        if (requestRef.current === request) setInvitations(loaded);
      } catch (loadError: unknown) {
        if (requestRef.current === request) {
          const code = getGroupErrorCode(loadError, "LOAD_FAILED");
          setError(
            tr(
              code === "LOAD_FAILED"
                ? "invitations.loadFailed"
                : `errors.${code}`,
            ),
          );
        }
      } finally {
        if (requestRef.current === request) {
          setLoading(false);
        }
      }
    },
    [service, tr, viewerUid],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const hasFocusedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      void load("refresh");
    }, [load]),
  );

  const removeInvitation = useCallback((invitationId: string) => {
    setInvitations((current) =>
      current.filter((item) => item.invitationId !== invitationId),
    );
  }, []);

  const reload = useCallback(() => load("initial"), [load]);
  const refresh = useCallback(() => load("refresh"), [load]);

  return {
    invitations,
    count: invitations.length,
    loading,
    error,
    removeInvitation,
    reload,
    refresh,
  };
}
