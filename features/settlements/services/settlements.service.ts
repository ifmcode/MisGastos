import type { IFriendLedgerRepository } from "@/features/friends/repositories/friend-ledger.repository";
import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";

import type { ISettlementsRepository } from "../repositories/settlements.repository";
import type { Settlement, SettlementInput } from "../types/settlement.types";
import {
  getPairSettlements,
  sortSettlements,
} from "../utils/settlement-latest";
import { createSettlementWithRepository } from "./settlement-create";
import { deleteSettlementWithRepository } from "./settlement-delete";
import { SettlementOperationError } from "./settlement.errors";
import {
  assertSettlementParticipant,
  requireSettlement,
  requireSettlementViewer,
} from "./settlement-guards";
import { updateSettlementWithRepository } from "./settlement-update";
import type { SettlementWriteDeps } from "./settlement-write-deps";

/**
 * 1:1 debt settlements. The service owns the participant, friendship and debt
 * guards; repositories only talk to Firestore and the UI translates the codes.
 *
 * A settlement is applied by existing: `deletedAt: null` counts in the pair
 * ledger and a soft-deleted record never does.
 */
export class SettlementsService {
  private readonly writeDeps: SettlementWriteDeps;

  constructor(
    repository: ISettlementsRepository,
    friendsRepository: IFriendsRepository,
    ledgerRepository: IFriendLedgerRepository,
  ) {
    this.writeDeps = { repository, friendsRepository, ledgerRepository };
  }

  /** Every settlement of the viewer, soft-deleted included, newest first. */
  async getSettlements(viewerUid: string): Promise<Settlement[]> {
    const viewer = requireSettlementViewer(viewerUid);
    const settlements = await this.writeDeps.repository.getSettlements(viewer);

    return sortSettlements(settlements);
  }

  async getSettlement(
    viewerUid: string,
    settlementId: string,
  ): Promise<Settlement> {
    const viewer = requireSettlementViewer(viewerUid);
    const settlement = await requireSettlement(
      this.writeDeps.repository,
      settlementId,
    );
    assertSettlementParticipant(settlement, viewer);

    return settlement;
  }

  /** Settlements of one pair, used by the friend detail and its badges. */
  async getPairSettlements(
    viewerUid: string,
    friendUid: string,
  ): Promise<Settlement[]> {
    const viewer = requireSettlementViewer(viewerUid);
    const settlements = await this.writeDeps.repository.getSettlements(viewer);

    return getPairSettlements(settlements, viewer, friendUid);
  }

  async createSettlement(
    viewerUid: string,
    input: SettlementInput,
  ): Promise<Settlement> {
    const viewer = requireSettlementViewer(viewerUid);

    return createSettlementWithRepository(this.writeDeps, viewer, input);
  }

  async updateSettlement(
    viewerUid: string,
    settlementId: string,
    input: SettlementInput,
  ): Promise<Settlement> {
    const viewer = requireSettlementViewer(viewerUid);
    const id = settlementId.trim();

    if (id.length === 0) {
      throw new SettlementOperationError("SETTLEMENT_NOT_FOUND");
    }

    return updateSettlementWithRepository(this.writeDeps, viewer, id, input);
  }

  /** Idempotent: deleting an already deleted settlement is a no-op. */
  async deleteSettlement(viewerUid: string, settlementId: string): Promise<void> {
    const viewer = requireSettlementViewer(viewerUid);
    const id = settlementId.trim();

    if (id.length === 0) {
      throw new SettlementOperationError("SETTLEMENT_NOT_FOUND");
    }

    return deleteSettlementWithRepository(this.writeDeps, viewer, id);
  }
}
