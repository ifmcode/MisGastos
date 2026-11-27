import {
  cacheSocialRow,
  cacheSocialRows,
  readCachedSocialRows,
} from "@/shared/lib/local-db/social-cache";

import type { Settlement } from "../types/settlement.types";
import {
  fromSettlementLocalRow,
  toSettlementLocalRow,
} from "./local-settlement.mapper";

const COLLECTION = "settlements" as const;

/** Cached settlements of the viewer, or null on a cold cache/flag off. */
export async function readCachedSettlements(
  viewerUid: string,
): Promise<Settlement[] | null> {
  const rows = await readCachedSocialRows({
    table: COLLECTION,
    ownerId: viewerUid,
    collection: COLLECTION,
  });

  if (rows === null) return null;

  return rows.flatMap((row) => {
    const settlement = fromSettlementLocalRow(row);
    return settlement ? [settlement] : [];
  });
}

export async function cacheSettlements(
  viewerUid: string,
  settlements: readonly Settlement[],
  now: string,
): Promise<void> {
  await cacheSocialRows({
    table: COLLECTION,
    ownerId: viewerUid,
    collection: COLLECTION,
    rows: settlements.map((settlement) =>
      toSettlementLocalRow(settlement, viewerUid),
    ),
    now,
  });
}

export async function cacheSettlement(
  viewerUid: string,
  settlement: Settlement,
  now: string,
): Promise<void> {
  await cacheSocialRow(
    COLLECTION,
    viewerUid,
    toSettlementLocalRow(settlement, viewerUid),
    now,
  );
}
