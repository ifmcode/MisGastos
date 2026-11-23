import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useGroupsService } from "@/features/groups/hooks/use-groups-service";
import type { GroupDetail } from "@/features/groups/types/group.types";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { isWalletArchived } from "@/features/wallets/utils/wallet-status";
import { useAuth } from "@/hooks/use-auth";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupSettlementErrorCode } from "../services/group-settlement.errors";
import type { GroupSettlement } from "../types/group-settlement.types";
import { getGroupSettlementErrorCopyKey } from "../utils/group-settlement-error-copy";
import { loadGroupSettlementDetail } from "./group-settlement-detail-load";
import { useGroupSettlementWrite } from "./use-group-settlement-write";
import { useGroupSettlementsService } from "./use-group-settlements-service";

export type GroupSettlementDetailStatus =
  | "loading"
  | "error"
  | "missing"
  | "ready";

export interface GroupSettlementDetailScreenController {
  status: GroupSettlementDetailStatus;
  settlement: GroupSettlement | null;
  detail: GroupDetail | null;
  viewerUid: string;
  error: string | null;
  reload: () => void;
  pending: boolean;
  mutationError: string | null;
  /** Resolves true only when the record was soft-deleted. */
  deleteSettlement: () => Promise<boolean>;
  /** Resolved name of the creditor's income wallet, or null. */
  walletName: string | null;
  walletArchived: boolean;
  isParticipant: boolean;
}

/**
 * Composition root of `/social/group-settlements/[settlementId]`. It re-resolves
 * the record on focus and never leaves by itself: the shared detail flow closes
 * after a successful delete, so a failure keeps the banner on screen.
 */
export function useGroupSettlementDetailScreen({
  settlementId,
}: {
  settlementId: string;
}): GroupSettlementDetailScreenController {
  const settlementsService = useGroupSettlementsService();
  const groupsService = useGroupsService();
  const { user } = useAuth();
  const viewerUid = user?.uid ?? "";
  const walletsState = useWallets();
  const { tr } = useScopedTranslation("groupExpenses");
  const write = useGroupSettlementWrite();
  const [settlement, setSettlement] = useState<GroupSettlement | null>(null);
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [status, setStatus] = useState<GroupSettlementDetailStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    if (!viewerUid || !settlementId) {
      setStatus("missing");
      return;
    }

    requestRef.current += 1;
    const request = requestRef.current;
    setError(null);

    try {
      const data = await loadGroupSettlementDetail({
        viewerUid,
        settlementId,
        settlementsService,
        groupsService,
      });
      if (requestRef.current !== request) return;

      if (data.kind === "missing") {
        setStatus("missing");
        return;
      }

      setSettlement(data.settlement);
      setDetail(data.detail);
      setStatus("ready");
    } catch (loadError: unknown) {
      if (requestRef.current !== request) return;

      const code = getGroupSettlementErrorCode(loadError, "LOAD_FAILED");
      setError(tr(`errors.${getGroupSettlementErrorCopyKey(code)}`));
      setStatus("error");
    }
  }, [groupsService, settlementId, settlementsService, tr, viewerUid]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasFocusedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      void load();
    }, [load]),
  );

  const reload = useCallback(() => {
    void load();
  }, [load]);
  const deleteSettlement = useCallback(async () => {
    if (!settlement) return false;

    return write.remove(viewerUid, settlement.id);
  }, [settlement, viewerUid, write.remove]);

  const wallet = settlement?.receiverWalletId
    ? (walletsState.wallets.find(
        (item) => item.id === settlement.receiverWalletId,
      ) ?? null)
    : null;

  return {
    status,
    settlement,
    detail,
    viewerUid,
    error,
    reload,
    pending: write.submitting,
    mutationError: write.actionError,
    deleteSettlement,
    walletName: wallet?.name ?? null,
    walletArchived: wallet ? isWalletArchived(wallet) : false,
    isParticipant: settlement
      ? settlement.participantIds.includes(viewerUid)
      : false,
  };
}
