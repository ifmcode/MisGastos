import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupSettlementErrorCode } from "../services/group-settlement.errors";
import type { GroupSettlement } from "../types/group-settlement.types";
import { getGroupSettlementErrorCopyKey } from "../utils/group-settlement-error-copy";
import { useGroupSettlementsService } from "./use-group-settlements-service";

type LoadMode = "initial" | "refresh";

export interface UseGroupDetailSettlementsOptions {
  viewerUid: string | undefined;
  groupId: string;
}

export interface GroupDetailSettlementsController {
  /** Active settlements only, newest first. */
  settlements: GroupSettlement[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  refresh: () => Promise<void>;
}

/**
 * Settlement list of one group inside the group detail. It refreshes when the
 * screen regains focus, so returning from the settle route (create, edit or a
 * delete on the detail route) always shows the new ledger without a manual
 * pull-to-refresh.
 */
export function useGroupDetailSettlements({
  viewerUid,
  groupId,
}: UseGroupDetailSettlementsOptions): GroupDetailSettlementsController {
  const service = useGroupSettlementsService();
  const { tr } = useScopedTranslation("groupExpenses");
  const [stored, setStored] = useState<GroupSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid || !groupId) {
        setStored([]);
        setError(null);
        setLoading(false);
        return;
      }

      requestRef.current += 1;
      const request = requestRef.current;
      if (mode === "initial") setLoading(true);
      setError(null);

      try {
        const loaded = await service.getGroupSettlements(viewerUid, groupId);
        if (requestRef.current === request) setStored(loaded);
      } catch (loadError: unknown) {
        if (requestRef.current === request) {
          const code = getGroupSettlementErrorCode(loadError, "LOAD_FAILED");
          setError(tr(`errors.${getGroupSettlementErrorCopyKey(code)}`));
        }
      } finally {
        if (requestRef.current === request && mode === "initial") {
          setLoading(false);
        }
      }
    },
    [groupId, service, tr, viewerUid],
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

  const retry = useCallback(() => {
    void load("initial");
  }, [load]);
  const refresh = useCallback(() => load("refresh"), [load]);
  const settlements = useMemo(
    () => stored.filter((settlement) => settlement.deletedAt === null),
    [stored],
  );

  return { settlements, loading, error, retry, refresh };
}
