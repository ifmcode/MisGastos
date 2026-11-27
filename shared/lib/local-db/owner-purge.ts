import type { DatabasePort } from "./database.port";
import type { LocalTableName } from "./local-db.types";

/**
 * Every local table whose rows belong to exactly one account. Nothing outside
 * this list stores `ownerId`: the shared rows of a group or a friendship are
 * copied here per account, so purging one account never touches another.
 */
export const OWNER_SCOPED_LOCAL_TABLES: readonly LocalTableName[] = [
  "wallets",
  "categories",
  "transactions",
  "transfers",
  "friendships",
  "friendRequests",
  "publicProfiles",
  "groups",
  "groupInvitations",
  "sharedExpenses",
  "settlements",
  "groupExpenses",
  "groupSettlements",
  "outbox",
  "outboxSeq",
  "conflicts",
  "syncState",
  "cacheMeta",
];

/**
 * Deletes every local row of one account in a single transaction, or none of
 * them if a delete fails. Callers must stop the owner's writes first
 * (`revokeOwnerLocalWrites`) and wait for the active sync cycle, otherwise a
 * read still in flight could repopulate the cache after the purge.
 */
export async function purgeOwnerLocalData(
  port: DatabasePort,
  ownerId: string,
): Promise<void> {
  await port.transaction(async (tx) => {
    for (const table of OWNER_SCOPED_LOCAL_TABLES) {
      await tx.delete(table, { ownerId });
    }
  });
}
