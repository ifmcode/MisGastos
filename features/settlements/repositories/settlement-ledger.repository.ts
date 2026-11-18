import type { IFriendLedgerRepository } from "@/features/friends/repositories/friend-ledger.repository";
import type { FriendLedgerEntry } from "@/features/friends/types/friend.types";

import { buildSettlementLedgerEntries } from "../utils/settlement-ledger";
import { FirebaseSettlementsRepository } from "./firebase-settlements.repository";
import type { ISettlementsRepository } from "./settlements.repository";

/**
 * Feeds the friends list with the debts cancelled by settlements. The balance is
 * never stored: it is folded from the active settlements on every load, and the
 * helper emits the reverse edge so the expense fold stays untouched.
 */
export class SettlementLedgerRepository implements IFriendLedgerRepository {
  constructor(
    private readonly repository: ISettlementsRepository = new FirebaseSettlementsRepository(),
  ) {}

  async getEntries(viewerUid: string): Promise<FriendLedgerEntry[]> {
    const settlements = await this.repository.getSettlements(viewerUid);

    return buildSettlementLedgerEntries(settlements);
  }
}
