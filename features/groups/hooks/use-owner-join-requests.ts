import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode } from "../services/group.errors";
import type { OwnerJoinRequestItem } from "../types/group-join.types";
import {
  useOwnerJoinRequestActions,
  type GroupJoinRequestActionsController,
} from "./use-owner-join-request-actions";
import { useGroupsService } from "./use-groups-service";

export type { GroupJoinDecision } from "./use-owner-join-request-actions";

type LoadMode = "initial" | "refresh";

export interface UseOwnerJoinRequestsOptions {
  viewerUid: string | undefined;
  /** Runs after a decision so the groups overview matches the queue. */
  onResponded?: () => void;
}

export interface OwnerJoinRequestsController
  extends GroupJoinRequestActionsController {
  items: OwnerJoinRequestItem[];
  count: number;
  loading: boolean;
  /** Load failure of the queue itself. */
  error: string | null;
  /** Failure of the last accept/reject; the answered row stays on screen. */
  actionError: string | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

/** Pending join requests of every group the viewer owns, oldest first. */
export function useOwnerJoinRequests({
  viewerUid,
  onResponded,
}: UseOwnerJoinRequestsOptions): OwnerJoinRequestsController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const [items, setItems] = useState<OwnerJoinRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid) {
        setItems([]);
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
        const loaded = await service.getOwnerJoinRequests(viewerUid);
        if (requestRef.current === request) setItems(loaded);
      } catch (loadError: unknown) {
        if (requestRef.current === request) {
          setError(tr(`errors.${getGroupErrorCode(loadError, "LOAD_FAILED")}`));
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

  // Another device or the notification inbox can answer a request elsewhere.
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      void load("refresh");
    }, [load]),
  );

  const removeItem = useCallback((groupId: string, requestId: string) => {
    setItems((current) =>
      current.filter(
        (entry) =>
          entry.groupId !== groupId || entry.item.request.id !== requestId,
      ),
    );
  }, []);

  const actions = useOwnerJoinRequestActions({
    viewerUid,
    onResolved: removeItem,
    onResponded,
  });

  const reload = useCallback(() => load("initial"), [load]);
  const refresh = useCallback(() => load("refresh"), [load]);

  return {
    items,
    count: items.length,
    loading,
    error,
    actionError: actions.error,
    pendingId: actions.pendingId,
    pendingDecision: actions.pendingDecision,
    respond: actions.respond,
    reload,
    refresh,
  };
}
