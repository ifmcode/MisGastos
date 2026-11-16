import { collection, doc } from "firebase/firestore";

import { db } from "@/lib/firebase";

export const TRANSACTIONS_COLLECTION = "transactions";
export const WALLETS_COLLECTION = "wallets";

export function movementRef(movementId: string) {
  return doc(db, TRANSACTIONS_COLLECTION, movementId);
}

/** Client-generated id so the movement exists after a single write. */
export function newMovementRef() {
  return doc(collection(db, TRANSACTIONS_COLLECTION));
}

export function walletRef(walletId: string) {
  return doc(db, WALLETS_COLLECTION, walletId);
}
