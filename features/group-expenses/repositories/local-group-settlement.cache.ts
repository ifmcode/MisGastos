import {
  cacheSocialRow,
  cacheSocialRows,
  readCachedSocialRows,
} from "@/shared/lib/local-db/social-cache";

import type { GroupSettlement } from "../types/group-settlement.types";
import {
  fromGroupSettlementLocalRow,
  toGroupSettlementLocalRow,
} from "./local-group-settlement.mapper";

const TABLE = "groupSettlements" as const;

function collectionKey(groupId: string): string {
  return `groupSettlements:${groupId}`;
}

/** Cached settlements of one group, or null on a cold cache/flag off. */
export async function readCachedGroupSettlements(
  viewerUid: string,
  groupId: string,
): Promise<GroupSettlement[] | null> {
  const rows = await readCachedSocialRows({
    table: TABLE,
    ownerId: viewerUid,
    collection: collectionKey(groupId),
    scope: { groupId },
  });

  if (rows === null) return null;

  return rows.flatMap((row) => {
    const settlement = fromGroupSettlementLocalRow(row);
    return settlement ? [settlement] : [];
  });
}

/** One cached settlement by id, independent of its group. */
export async function readCachedGroupSettlementById(
  viewerUid: string,
  settlementId: string,
): Promise<GroupSettlement | null> {
  const rows = await readCachedSocialRows({
    table: TABLE,
    ownerId: viewerUid,
    collection: "groupSettlements:*",
  });

  const row = rows?.find((candidate) => candidate.id === settlementId);
  return row ? fromGroupSettlementLocalRow(row) : null;
}

export async function cacheGroupSettlements(
  viewerUid: string,
  groupId: string,
  settlements: readonly GroupSettlement[],
  now: string,
): Promise<void> {
  await cacheSocialRows({
    table: TABLE,
    ownerId: viewerUid,
    collection: collectionKey(groupId),
    scope: { groupId },
    rows: settlements.map((settlement) =>
      toGroupSettlementLocalRow(settlement, viewerUid),
    ),
    now,
  });
}

export async function cacheGroupSettlement(
  viewerUid: string,
  settlement: GroupSettlement,
  now: string,
): Promise<void> {
  await cacheSocialRow(
    TABLE,
    viewerUid,
    toGroupSettlementLocalRow(settlement, viewerUid),
    now,
  );
}
