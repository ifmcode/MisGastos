import type { FriendLedgerEntry } from "../types/friend.types";

/**
 * Seam for TICKET-009 (shared expenses) and TICKET-010 (settlements). The
 * friends list folds these entries instead of storing a balance, so the social
 * slice stays offline-compatible and append-only.
 */
export interface IFriendLedgerRepository {
  getEntries(viewerUid: string): Promise<FriendLedgerEntry[]>;
}

/** No shared expenses or settlements exist yet, so every balance starts at 0. */
export class EmptyFriendLedgerRepository implements IFriendLedgerRepository {
  async getEntries(viewerUid: string): Promise<FriendLedgerEntry[]> {
    void viewerUid;
    return [];
  }
}
