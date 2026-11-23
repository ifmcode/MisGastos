import type { IGroupsRepository } from "@/features/groups/repositories/groups.repository";

import type { IGroupExpensesRepository } from "../repositories/group-expenses.repository";
import type { IGroupSettlementsRepository } from "../repositories/group-settlements.repository";
import type {
  GroupSettlement,
  GroupSettlementInput,
} from "../types/group-settlement.types";
import { sortGroupSettlements } from "../utils/group-settlement-order";
import { createGroupSettlementRecord } from "./group-settlement-create";
import { deleteGroupSettlementRecord } from "./group-settlement-delete";
import { GroupExpenseOperationError } from "./group-expense.errors";
import { assertGroupExpenseMember } from "./group-expense-guards";
import {
  assertGroupSettlementParticipant,
  requireGroupForSettlement,
  requireGroupSettlement,
  requireGroupSettlementViewer,
} from "./group-settlement-guards";
import { updateGroupSettlementRecord } from "./group-settlement-update";
import type { GroupSettlementWriteDeps } from "./group-settlement-write-deps";

/**
 * Group debt settlements (TICKET-010 Phase B). The service owns the membership,
 * pair, direction, debt-bound and wallet-ownership guards; repositories only
 * talk to Firestore and the UI translates the stable codes.
 *
 * A settlement is applied by existing: `deletedAt: null` counts in the group
 * ledger and a soft-deleted record never does.
 */
export class GroupSettlementsService {
  private readonly writeDeps: GroupSettlementWriteDeps;

  constructor(
    repository: IGroupSettlementsRepository,
    groupsRepository: IGroupsRepository,
    expensesRepository: IGroupExpensesRepository,
  ) {
    this.writeDeps = { repository, groupsRepository, expensesRepository };
  }

  /** Every settlement of the group, soft-deleted included, newest first. */
  async getGroupSettlements(
    viewerUid: string,
    groupId: string,
  ): Promise<GroupSettlement[]> {
    const viewer = requireGroupSettlementViewer(viewerUid);
    const group = await requireGroupForSettlement(
      this.writeDeps.groupsRepository,
      groupId,
    );
    assertGroupExpenseMember(group, viewer);

    const settlements = await this.writeDeps.repository.getGroupSettlements(
      group.id,
    );

    return sortGroupSettlements(settlements);
  }

  /** One settlement; the viewer must be one of the two pair members. */
  async getGroupSettlement(
    viewerUid: string,
    settlementId: string,
  ): Promise<GroupSettlement> {
    const viewer = requireGroupSettlementViewer(viewerUid);
    const settlement = await requireGroupSettlement(
      this.writeDeps.repository,
      settlementId,
    );
    assertGroupSettlementParticipant(settlement, viewer);

    return settlement;
  }

  /** Either member of the pair may record it; the stored debt fixes the direction. */
  async createGroupSettlement(
    viewerUid: string,
    input: GroupSettlementInput,
  ): Promise<GroupSettlement> {
    const viewer = requireGroupSettlementViewer(viewerUid);

    return createGroupSettlementRecord(this.writeDeps, viewer, input);
  }

  async updateGroupSettlement(
    viewerUid: string,
    settlementId: string,
    input: GroupSettlementInput,
  ): Promise<GroupSettlement> {
    const viewer = requireGroupSettlementViewer(viewerUid);
    const id = typeof settlementId === "string" ? settlementId.trim() : "";

    if (id.length === 0) {
      throw new GroupExpenseOperationError("SETTLEMENT_NOT_FOUND");
    }

    return updateGroupSettlementRecord(this.writeDeps, viewer, id, input);
  }

  /** Idempotent: deleting an already deleted settlement is a no-op. */
  async deleteGroupSettlement(
    viewerUid: string,
    settlementId: string,
  ): Promise<void> {
    const viewer = requireGroupSettlementViewer(viewerUid);
    const id = typeof settlementId === "string" ? settlementId.trim() : "";

    if (id.length === 0) {
      throw new GroupExpenseOperationError("SETTLEMENT_NOT_FOUND");
    }

    return deleteGroupSettlementRecord(this.writeDeps, viewer, id);
  }
}
