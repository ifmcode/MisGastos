import { MISSING_GROUP_CODES } from "@/features/groups/hooks/use-group-detail";
import type { GroupsService } from "@/features/groups/services/groups.service";
import { getGroupErrorCode } from "@/features/groups/services/group.errors";
import type { GroupDetail } from "@/features/groups/types/group.types";

import type { GroupExpenseErrorCode } from "../services/group-expense.errors";
import { getGroupSettlementErrorCode } from "../services/group-settlement.errors";
import type { GroupSettlementsService } from "../services/group-settlements.service";
import type { GroupSettlement } from "../types/group-settlement.types";

/** Codes that mean the pair no longer resolves for the viewer. */
const MISSING_SETTLEMENT_CODES: readonly GroupExpenseErrorCode[] = [
  "SETTLEMENT_NOT_FOUND",
  "NOT_SETTLEMENT_PARTICIPANT",
  "PERMISSION_DENIED",
];

export type GroupSettlementDetailData =
  | { kind: "missing" }
  | { kind: "ready"; settlement: GroupSettlement; detail: GroupDetail };

export interface LoadGroupSettlementDetailOptions {
  viewerUid: string;
  settlementId: string;
  settlementsService: GroupSettlementsService;
  groupsService: GroupsService;
}

/**
 * Reads one settlement and its group. A soft-deleted, unknown or foreign record
 * resolves to `missing`; a group the viewer cannot read does too. Real failures
 * are rethrown for the hook to translate.
 */
export async function loadGroupSettlementDetail({
  viewerUid,
  settlementId,
  settlementsService,
  groupsService,
}: LoadGroupSettlementDetailOptions): Promise<GroupSettlementDetailData> {
  let stored: GroupSettlement;

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

  try {
    const detail = await groupsService.getGroupDetail(viewerUid, stored.groupId);

    return { kind: "ready", settlement: stored, detail };
  } catch (groupError: unknown) {
    const code = getGroupErrorCode(groupError, "LOAD_FAILED");
    if (MISSING_GROUP_CODES.includes(code)) return { kind: "missing" };
    throw groupError;
  }
}
