import { canEditSettlementAmount } from "@/features/settlements/utils/settlement-debt";

import type { GroupSettlementInput } from "../types/group-settlement.types";
import type { GroupSettlement } from "../types/group-settlement.types";
import { GroupExpenseOperationError } from "./group-expense.errors";
import { assertGroupExpenseMember } from "./group-expense-guards";
import {
  assertAmountWithinPairDebt,
  loadGroupPairDebt,
} from "./group-settlement-debt";
import {
  assertCreditorWallet,
  assertGroupSettlementParticipant,
  requireGroupForSettlement,
  requireGroupSettlement,
  validateGroupSettlementOrThrow,
} from "./group-settlement-guards";
import { buildUpdateGroupSettlementDto } from "./group-settlement-persist";
import {
  buildGroupSettlementEvent,
  type GroupSettlementWriteDeps,
} from "./group-settlement-write-deps";

/**
 * Edits amount, date, note and the creditor's own link. The group, the pair,
 * the direction and the currency are immutable, and the amount is re-validated
 * against the live debt row of the pair **excluding this settlement** — the
 * pre-settlement debt, which is exactly the bound the edit form shows.
 *
 * Excluding the row can also move the simplified suggestions elsewhere: when
 * the pair no longer appears in that view the stored amount is the bound, so the
 * note and the date stay editable and the amount may be kept or lowered but
 * never raised. An existing settlement is never rejected with `NO_DEBT`.
 */
export async function updateGroupSettlementRecord(
  deps: GroupSettlementWriteDeps,
  viewerUid: string,
  settlementId: string,
  input: GroupSettlementInput,
): Promise<GroupSettlement> {
  const existing = await requireGroupSettlement(deps.repository, settlementId);
  assertGroupSettlementParticipant(existing, viewerUid);

  if (existing.deletedAt !== null) {
    throw new GroupExpenseOperationError("ALREADY_DELETED");
  }

  const group = await requireGroupForSettlement(
    deps.groupsRepository,
    existing.groupId,
  );
  assertGroupExpenseMember(group, viewerUid);

  const value = validateGroupSettlementOrThrow(input);

  if (
    value.fromUserId !== existing.fromUserId ||
    value.toUserId !== existing.toUserId
  ) {
    throw new GroupExpenseOperationError("DIRECTION_MISMATCH");
  }
  if (value.currency !== existing.currency) {
    throw new GroupExpenseOperationError("CURRENCY_MISMATCH");
  }

  const viewerIsCreditor = existing.toUserId === viewerUid;
  assertCreditorWallet(value, viewerIsCreditor);

  if (
    !canEditSettlementAmount(existing, viewerUid) &&
    value.amountCents !== existing.amountCents
  ) {
    throw new GroupExpenseOperationError("AMOUNT_LOCKED");
  }

  const pairDebt = await loadGroupPairDebt({
    expensesRepository: deps.expensesRepository,
    settlementsRepository: deps.repository,
    groupId: existing.groupId,
    currency: existing.currency,
    fromUserId: existing.fromUserId,
    toUserId: existing.toUserId,
    simplifyDebts: group.simplifyDebts,
    excludeSettlementId: existing.id,
  });

  // The excluded row already is the pre-settlement debt, so the stored amount is
  // never added on top (that would double the bound). When the pair is gone from
  // the view or its row now runs the opposite way, the stored amount keeps the
  // record editable (date/note and reductions) without trusting a debt row that
  // no longer matches the immutable direction.
  const sameDirection =
    pairDebt !== null &&
    pairDebt.fromUserId === existing.fromUserId &&
    pairDebt.toUserId === existing.toUserId;
  const debt = {
    currency: existing.currency,
    fromUserId: existing.fromUserId,
    toUserId: existing.toUserId,
    amountCents: sameDirection ? pairDebt.amountCents : existing.amountCents,
  };
  assertAmountWithinPairDebt(debt, value.amountCents);

  const now = new Date().toISOString();
  const dto = buildUpdateGroupSettlementDto({
    value,
    existing,
    viewerUid,
    now,
  });

  return deps.repository.updateGroupSettlement(
    viewerUid,
    existing.id,
    dto,
    buildGroupSettlementEvent({
      settlement: {
        ...existing,
        amountCents: value.amountCents,
        date: value.date,
        note: value.note,
        updatedAt: now,
      },
      group,
      actorUid: viewerUid,
      event: "updated",
      notifiedAt: now,
    }),
  );
}
