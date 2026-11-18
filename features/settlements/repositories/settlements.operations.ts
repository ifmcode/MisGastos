import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";

import type { Settlement } from "../types/settlement.types";
import { mapSettlementDocument } from "./settlements.mapper";

export const SETTLEMENTS_COLLECTION = "settlements";

export function settlementRef(settlementId: string) {
  return doc(db, SETTLEMENTS_COLLECTION, settlementId);
}

/** New id generated client-side so the settlement exists after one write. */
export function newSettlementRef() {
  return doc(collection(db, SETTLEMENTS_COLLECTION));
}

export async function getSettlementOperation(
  settlementId: string,
): Promise<Settlement | null> {
  const snapshot = await getDoc(settlementRef(settlementId));
  if (!snapshot.exists()) return null;

  return mapSettlementDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}

/** `array-contains` on the participant pair; no composite index needed. */
export async function getSettlementsOperation(
  viewerUid: string,
): Promise<Settlement[]> {
  const snapshot = await getDocs(
    query(
      collection(db, SETTLEMENTS_COLLECTION),
      where("participantIds", "array-contains", viewerUid),
    ),
  );

  const settlements: Settlement[] = [];

  for (const document of snapshot.docs) {
    const settlement = mapSettlementDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (settlement) settlements.push(settlement);
  }

  return settlements;
}
