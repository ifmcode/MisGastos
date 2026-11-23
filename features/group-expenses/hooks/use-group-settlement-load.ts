import { useCallback, useEffect, useRef, useState } from "react";

import type { GroupDetail } from "@/features/groups/types/group.types";
import { useGroupsService } from "@/features/groups/hooks/use-groups-service";
import { useAuth } from "@/hooks/use-auth";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupSettlementErrorCode } from "../services/group-settlement.errors";
import type { GroupBalances } from "../types/group-balance.types";
import type { GroupSettlement } from "../types/group-settlement.types";
import { getGroupSettlementErrorCopyKey } from "../utils/group-settlement-error-copy";
import { loadGroupSettlementData } from "./group-settlement-load";
import { useGroupExpensesService } from "./use-group-expenses-service";
import { useGroupSettlementsService } from "./use-group-settlements-service";

export type GroupSettlementLoadStatus =
  | "loading"
  | "error"
  | "missing"
  | "ready";

export interface UseGroupSettlementLoadOptions {
  viewerUid: string | undefined;
  /** Create route group; ignored on edit, where the record owns it. */
  groupId: string;
  /** Empty on create. */
  settlementId: string;
}

export interface GroupSettlementLoadController {
  status: GroupSettlementLoadStatus;
  detail: GroupDetail | null;
  settlement: GroupSettlement | null;
  balances: GroupBalances | null;
  error: string | null;
  reload: () => void;
}

/**
 * Everything the settlement form needs to load: the stored record on edit, the
 * group detail for names and the settlement-aware balances that resolve the
 * pair debt. Loading, first-load error with retry, and the safe missing state
 * are handled here once.
 */
export function useGroupSettlementLoad({
  viewerUid,
  groupId,
  settlementId,
}: UseGroupSettlementLoadOptions): GroupSettlementLoadController {
  const settlementsService = useGroupSettlementsService();
  const expensesService = useGroupExpensesService();
  const groupsService = useGroupsService();
  const { tr } = useScopedTranslation("groupExpenses");
  const [status, setStatus] = useState<GroupSettlementLoadStatus>("loading");
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [settlement, setSettlement] = useState<GroupSettlement | null>(null);
  const [balances, setBalances] = useState<GroupBalances | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    if (!viewerUid) {
      setStatus("missing");
      return;
    }

    requestRef.current += 1;
    const request = requestRef.current;
    setStatus("loading");
    setError(null);

    try {
      const data = await loadGroupSettlementData({
        viewerUid,
        groupId,
        settlementId,
        settlementsService,
        expensesService,
        groupsService,
      });
      if (requestRef.current !== request) return;

      if (data.kind === "missing") {
        setStatus("missing");
        return;
      }

      setDetail(data.detail);
      setSettlement(data.settlement);
      setBalances(data.balances);
      setStatus("ready");
    } catch (loadError: unknown) {
      if (requestRef.current !== request) return;

      const code = getGroupSettlementErrorCode(loadError, "LOAD_FAILED");
      setError(tr(`errors.${getGroupSettlementErrorCopyKey(code)}`));
      setStatus("error");
    }
  }, [
    expensesService,
    groupId,
    groupsService,
    settlementsService,
    settlementId,
    tr,
    viewerUid,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  return { status, detail, settlement, balances, error, reload };
}
