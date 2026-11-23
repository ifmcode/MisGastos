import { useMemo } from "react";

import type { GroupDetail } from "@/features/groups/types/group.types";
import { canEditSettlementAmount } from "@/features/settlements/utils/settlement-debt";
import { getTodayIsoDate } from "@/shared/utils/date";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupBalances, GroupDebt } from "../types/group-balance.types";
import type { GroupSettlement } from "../types/group-settlement.types";
import { getGroupMemberName } from "../utils/group-expense-members";
import {
  createGroupSettlementEditFormValues,
  createGroupSettlementFormValues,
  findGroupSettlementDebt,
  getGroupSettlementEditBoundCents,
  getGroupSettlementViewerDirection,
} from "../utils/group-settlement-form";
import type {
  GroupSettlementDirection,
  GroupSettlementFormValues,
} from "../utils/group-settlement-form.types";

export interface UseGroupSettlementTargetOptions {
  viewerUid: string;
  groupId: string;
  settlement: GroupSettlement | null;
  balances: GroupBalances | null;
  detail: GroupDetail | null;
  /** Create route pair and currency; the stored record wins on edit. */
  currency: string;
  fromUserId: string;
  toUserId: string;
}

export interface GroupSettlementTarget {
  /** Canonical pair with the amount the debt card shows. */
  debt: GroupDebt | null;
  direction: GroupSettlementDirection | null;
  boundCents: number;
  initialValues: GroupSettlementFormValues | null;
  viewerIsCreditor: boolean;
  amountLocked: boolean;
  groupName: string;
  fromName: string;
  toName: string;
}

/**
 * Resolves the pair of the form from the stored record (edit) or from the
 * settlement-aware balances (create), and derives the bound, the viewer
 * direction, the initial values and the display names. A stale route pair
 * always yields the canonical direction of the ledger.
 */
export function useGroupSettlementTarget({
  viewerUid,
  groupId,
  settlement,
  balances,
  detail,
  currency,
  fromUserId,
  toUserId,
}: UseGroupSettlementTargetOptions): GroupSettlementTarget {
  const { t } = useScopedTranslation("groupExpenses");
  const pairDebt = useMemo(
    () =>
      findGroupSettlementDebt(
        balances,
        settlement?.currency ?? currency,
        settlement?.fromUserId ?? fromUserId,
        settlement?.toUserId ?? toUserId,
      ),
    [balances, currency, fromUserId, settlement, toUserId],
  );
  const boundCents = settlement
    ? getGroupSettlementEditBoundCents(settlement, pairDebt)
    : (pairDebt?.amountCents ?? 0);
  const debt = useMemo<GroupDebt | null>(() => {
    if (settlement) {
      return {
        currency: settlement.currency,
        fromUserId: settlement.fromUserId,
        toUserId: settlement.toUserId,
        amountCents: boundCents,
      };
    }

    return pairDebt;
  }, [boundCents, pairDebt, settlement]);
  const direction = debt
    ? getGroupSettlementViewerDirection(viewerUid, debt)
    : null;
  const initialValues = useMemo<GroupSettlementFormValues | null>(() => {
    const today = getTodayIsoDate();
    if (settlement) {
      return createGroupSettlementEditFormValues({
        settlement,
        viewerUid,
        today,
      });
    }
    if (!pairDebt) return null;

    return createGroupSettlementFormValues({
      viewerUid,
      groupId: detail?.group.id ?? groupId,
      debt: pairDebt,
      today,
    });
  }, [detail, groupId, pairDebt, settlement, viewerUid]);
  const memberNames = {
    viewerUid,
    viewerLabel: t("viewerName"),
    fallback: t("memberFallback"),
  };
  const members = detail?.members ?? [];

  return {
    debt,
    direction,
    boundCents,
    initialValues,
    viewerIsCreditor: settlement
      ? settlement.toUserId === viewerUid
      : direction === "viewer-receives",
    amountLocked: settlement
      ? !canEditSettlementAmount(settlement, viewerUid)
      : false,
    groupName: detail?.group.name ?? "",
    fromName: debt
      ? getGroupMemberName(members, debt.fromUserId, memberNames)
      : "",
    toName: debt ? getGroupMemberName(members, debt.toUserId, memberNames) : "",
  };
}
