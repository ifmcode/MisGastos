import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { assertServerSnapshot } from "@/shared/lib/local-db/offline-read";

import type { GroupSettlement } from "../types/group-settlement.types";
import { mapGroupSettlementDocument } from "./group-settlements.mapper";

/**
 * Root collection with a `groupId` field, exactly like `groupExpenses`: the
 * income movement is validated in the rules with one `getAfter` on a known root
 * path plus one `get` on the group, and the settlement id never builds a path
 * from user input outside the service.
 */
export const GROUP_SETTLEMENTS_COLLECTION = "groupSettlements";

export function groupSettlementRef(settlementId: string) {
  return doc(db, GROUP_SETTLEMENTS_COLLECTION, settlementId);
}

/** Client-generated id so the settlement exists after a single write. */
export function newGroupSettlementRef() {
  return doc(collection(db, GROUP_SETTLEMENTS_COLLECTION));
}

export async function getGroupSettlementOperation(
  settlementId: string,
): Promise<GroupSettlement | null> {
  const snapshot = await getDoc(groupSettlementRef(settlementId));
  if (!snapshot.exists()) return null;

  return mapGroupSettlementDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}

/**
 * Single `where('groupId', '==', groupId)` with a client-side sort: one
 * single-field index, no composite index, soft-deleted rows included so the
 * audit trail and the edit exclusion stay possible.
 */
export async function getGroupSettlementsOperation(
  groupId: string,
): Promise<GroupSettlement[]> {
  const snapshot = await getDocs(
    query(
      collection(db, GROUP_SETTLEMENTS_COLLECTION),
      where("groupId", "==", groupId),
    ),
  );
  assertServerSnapshot(snapshot);

  const settlements: GroupSettlement[] = [];

  for (const document of snapshot.docs) {
    const settlement = mapGroupSettlementDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (settlement) settlements.push(settlement);
  }

  return settlements;
}
