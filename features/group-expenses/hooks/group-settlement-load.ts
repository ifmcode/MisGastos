import { MISSING_GROUP_CODES } from "@/features/groups/hooks/use-group-detail";
import type { GroupsService } from "@/features/groups/services/groups.service";
import { getGroupErrorCode } from "@/features/groups/services/group.errors";
import type { GroupDetail } from "@/features/groups/types/group.types";

import type { GroupExpensesService } from "../services/group-expenses.service";
import type { GroupExpenseErrorCode } from "../services/group-expense.errors";
import { getGroupSettlementErrorCode } from "../services/group-settlement.errors";
import type { GroupSettlementsService } from "../services/group-settlements.service";
import type { GroupBalances } from "../types/group-balance.types";
import type { GroupSettlement } from "../types/group-settlement.types";

/** Codes that mean the pair no longer resolves for the viewer. */
const MISSING_SETTLEMENT_CODES: readonly GroupExpenseErrorCode[] = [
  "SETTLEMENT_NOT_FOUND",
  "NOT_SETTLEMENT_PARTICIPANT",
  "PERMISSION_DENIED",
];

export type GroupSettlementLoadData =
  | { kind: "missing" }
  | {
      kind: "ready";
      detail: GroupDetail;
      settlement: GroupSettlement | null;
      balances: GroupBalances;
    };

export interface LoadGroupSettlementDataOptions {
  viewerUid: string;
  groupId: string;
  settlementId: string;
  settlementsService: GroupSettlementsService;
  expensesService: GroupExpensesService;
  groupsService: GroupsService;
}

/**
 * Reads the record (edit), the group and the settlement-aware balances in one
 * pass. A record or group the viewer cannot read resolves to `missing`; real
 * failures are rethrown so the hook can translate the stable code.
 */
export async function loadGroupSettlementData({
  viewerUid,
  groupId,
  settlementId,
  settlementsService,
  expensesService,
  groupsService,
}: LoadGroupSettlementDataOptions): Promise<GroupSettlementLoadData> {
  let stored: GroupSettlement | null = null;

  if (settlementId.trim().length > 0) {
    try {
      stored = await settlementsService.getGroupSettlement(
        viewerUid,
        settlementId,
      );
    } catch (recordError: unknown) {
      const code = getGroupSettlementErrorCode(recordError, "LOAD_FAILED");
      if (MISSING_SETTLEMENT_CODES.includes(code)) return { kind: "missing" };
      throw recordError;
    }

    if (stored.deletedAt !== null) return { kind: "missing" };
  }

  try {
    const [detail, balances] = await Promise.all([
      groupsService.getGroupDetail(viewerUid, stored?.groupId ?? groupId),
      expensesService.getGroupBalances(viewerUid, stored?.groupId ?? groupId),
    ]);

    return { kind: "ready", detail, settlement: stored, balances };
  } catch (groupError: unknown) {
    const code = getGroupErrorCode(groupError, "LOAD_FAILED");
    if (MISSING_GROUP_CODES.includes(code)) return { kind: "missing" };
    throw groupError;
  }
}
