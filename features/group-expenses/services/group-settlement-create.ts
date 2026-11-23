import type { GroupSettlementInput } from "../types/group-settlement.types";
import type { GroupSettlement } from "../types/group-settlement.types";
import { assertGroupExpenseMember } from "./group-expense-guards";
import {
  assertAmountWithinPairDebt,
  assertPairDebtDirection,
  loadGroupPairDebt,
} from "./group-settlement-debt";
import {
  assertCreditorWallet,
  assertPairMembers,
  assertViewerInPair,
  requireGroupForSettlement,
  validateGroupSettlementOrThrow,
} from "./group-settlement-guards";
import {
  buildCreateGroupSettlementDto,
  buildGroupSettlementParticipantIds,
} from "./group-settlement-persist";
import {
  buildGroupSettlementEvent,
  type GroupSettlementWriteDeps,
} from "./group-settlement-write-deps";

/**
 * Records money that already moved between two members. The pair must be one of
 * the current debt rows — the simplified suggestion when the group simplifies,
 * the direct debt otherwise — both sides may record it, and only the creditor
 * may link one of their own wallets as the income mirror.
 */
export async function createGroupSettlementRecord(
  deps: GroupSettlementWriteDeps,
  viewerUid: string,
  input: GroupSettlementInput,
): Promise<GroupSettlement> {
  const value = validateGroupSettlementOrThrow(input);
  const group = await requireGroupForSettlement(
    deps.groupsRepository,
    value.groupId,
  );
  assertGroupExpenseMember(group, viewerUid);
  assertViewerInPair(value, viewerUid);
  assertPairMembers(value, group);

  const debt = assertPairDebtDirection(
    await loadGroupPairDebt({
      expensesRepository: deps.expensesRepository,
      settlementsRepository: deps.repository,
      groupId: group.id,
      currency: value.currency,
      fromUserId: value.fromUserId,
      toUserId: value.toUserId,
      simplifyDebts: group.simplifyDebts,
    }),
    value.fromUserId,
    value.toUserId,
  );
  assertAmountWithinPairDebt(debt, value.amountCents);

  assertCreditorWallet(value, value.toUserId === viewerUid);

  const now = new Date().toISOString();
  const participantIds = buildGroupSettlementParticipantIds(
    value.fromUserId,
    value.toUserId,
  );
  const dto = buildCreateGroupSettlementDto({
    value,
    participantIds,
    viewerUid,
    now,
  });

  return deps.repository.createGroupSettlement(dto, (settlement) =>
    buildGroupSettlementEvent({
      settlement,
      group,
      actorUid: viewerUid,
      event: "created",
      notifiedAt: settlement.updatedAt,
    }),
  );
}
