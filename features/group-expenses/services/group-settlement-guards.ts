import type { IGroupsRepository } from "@/features/groups/repositories/groups.repository";
import type { Group } from "@/features/groups/types/group.types";
import { isGroupMember } from "@/features/groups/utils/group-membership";

import type { IGroupSettlementsRepository } from "../repositories/group-settlements.repository";
import { validateGroupSettlementInput } from "../schemas/group-settlement.schema";
import type {
  GroupSettlement,
  GroupSettlementInput,
  ValidatedGroupSettlement,
} from "../types/group-settlement.types";
import { GroupExpenseOperationError } from "./group-expense.errors";
import { GroupSettlementValidationError } from "./group-settlement.errors";

/** Every use case requires the signed-in uid; a blank one is not a session. */
export function requireGroupSettlementViewer(viewerUid: unknown): string {
  const viewer = typeof viewerUid === "string" ? viewerUid.trim() : "";

  if (viewer.length === 0) {
    throw new GroupExpenseOperationError("SIGN_IN_REQUIRED");
  }

  return viewer;
}

/** Loads the record or fails with a stable code, never with a sentence. */
export async function requireGroupSettlement(
  repository: IGroupSettlementsRepository,
  settlementId: string,
): Promise<GroupSettlement> {
  const id = typeof settlementId === "string" ? settlementId.trim() : "";
  const settlement = id.length > 0 ? await repository.getGroupSettlement(id) : null;

  if (!settlement) throw new GroupExpenseOperationError("SETTLEMENT_NOT_FOUND");

  return settlement;
}

/** Only the two members of the pair may read, record, edit or delete it. */
export function assertGroupSettlementParticipant(
  settlement: GroupSettlement,
  viewerUid: string,
): void {
  if (!settlement.participantIds.includes(viewerUid)) {
    throw new GroupExpenseOperationError("NOT_SETTLEMENT_PARTICIPANT");
  }
}

/** The viewer must be the debtor or the creditor of the pair, never both. */
export function assertViewerInPair(
  value: ValidatedGroupSettlement,
  viewerUid: string,
): void {
  if (value.fromUserId !== viewerUid && value.toUserId !== viewerUid) {
    throw new GroupExpenseOperationError("NOT_SETTLEMENT_PARTICIPANT");
  }
}

/** Both sides of the pair must be active members of the group. */
export function assertPairMembers(
  value: ValidatedGroupSettlement,
  group: Group,
): void {
  if (
    !isGroupMember(group.memberIds, value.fromUserId) ||
    !isGroupMember(group.memberIds, value.toUserId)
  ) {
    throw new GroupExpenseOperationError("NOT_GROUP_MEMBER");
  }
}

/**
 * Only the creditor owns the income movement, so a wallet sent by the debtor is
 * a field failure of that input; the rules enforce the same invariant.
 */
export function assertCreditorWallet(
  value: ValidatedGroupSettlement,
  viewerIsCreditor: boolean,
): void {
  if (!viewerIsCreditor && value.walletId !== null) {
    throw new GroupSettlementValidationError([
      { field: "walletId", code: "WALLET_NOT_OWNED" },
    ]);
  }
}

/** Validates the form payload and throws the domain validation error. */
export function validateGroupSettlementOrThrow(
  input: GroupSettlementInput,
): ValidatedGroupSettlement {
  const validation = validateGroupSettlementInput(input);

  if (!validation.ok) {
    throw new GroupSettlementValidationError(validation.error);
  }

  return validation.value;
}

/** Loads the group or fails with a stable code; rules deny a non-member read. */
export async function requireGroupForSettlement(
  repository: IGroupsRepository,
  groupId: string,
): Promise<Group> {
  const id = typeof groupId === "string" ? groupId.trim() : "";
  const group = id.length > 0 ? await repository.getGroup(id) : null;

  if (!group) throw new GroupExpenseOperationError("GROUP_NOT_FOUND");

  return group;
}
