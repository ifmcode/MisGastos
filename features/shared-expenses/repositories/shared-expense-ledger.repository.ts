import type { IFriendLedgerRepository } from "@/features/friends/repositories/friend-ledger.repository";
import type { FriendLedgerEntry } from "@/features/friends/types/friend.types";

import { buildExpenseLedgerEntries } from "../utils/expense-ledger";
import { FirebaseSharedExpensesRepository } from "./firebase-shared-expenses.repository";
import type { ISharedExpensesRepository } from "./shared-expenses.repository";

/**
 * Feeds the friends list with the debts derived from shared expenses. The
 * balance is never stored: it is folded from the active expenses on every load.
 */
export class SharedExpenseLedgerRepository implements IFriendLedgerRepository {
  constructor(
    private readonly repository: ISharedExpensesRepository = new FirebaseSharedExpensesRepository(),
  ) {}

  async getEntries(viewerUid: string): Promise<FriendLedgerEntry[]> {
    const expenses = await this.repository.getExpenses(viewerUid);

    return buildExpenseLedgerEntries(expenses);
  }
}
