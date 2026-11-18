import type { FriendLedgerEntry } from "../types/friend.types";
import type { IFriendLedgerRepository } from "./friend-ledger.repository";

/**
 * Folds several ledger sources (shared expenses, settlements) into one seam.
 * `calculateFriendBalances` already ignores soft-deleted entries, so the
 * composition is a plain concatenation and the order stays deterministic.
 */
export class ComposedFriendLedgerRepository implements IFriendLedgerRepository {
  constructor(
    private readonly repositories: readonly IFriendLedgerRepository[],
  ) {}

  async getEntries(viewerUid: string): Promise<FriendLedgerEntry[]> {
    const groups = await Promise.all(
      this.repositories.map((repository) => repository.getEntries(viewerUid)),
    );

    return groups.flat();
  }
}
