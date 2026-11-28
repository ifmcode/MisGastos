import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { assertServerSnapshot } from "@/shared/lib/local-db/offline-read";
import { nextRevision } from "@/shared/utils/revision";

import { Wallet } from "../types/wallet.types";
import type { WalletOrderUpdate } from "../utils/wallet-order";
import { mapWalletDocument } from "./wallet.mapper";

const WALLET_COLLECTION = "wallets";

/**
 * Reads the owner's wallets once so every batch entry carries the stored
 * revision the rules expect. Unreadable documents are ignored: they cannot
 * supply a base revision anyway.
 */
async function loadOwnerWallets(
  ownerId: string,
): Promise<Map<string, Wallet>> {
  const walletsRef = collection(db, WALLET_COLLECTION);
  const snapshot = await getDocs(
    query(walletsRef, where("ownerId", "==", ownerId)),
  );
  assertServerSnapshot(snapshot);

  const byId = new Map<string, Wallet>();
  for (const document of snapshot.docs) {
    const wallet = mapWalletDocument(document.id, document.data(), ownerId);
    if (wallet) byId.set(wallet.id, wallet);
  }

  return byId;
}

/**
 * Persists the reordered positions in one batch. Only `sortOrder`, `updatedAt`
 * and the bumped `revision` are written; a stale id is skipped because guessing
 * its base revision would make the rules reject the whole batch.
 */
export async function reorderWalletDocuments(
  ownerId: string,
  updates: readonly WalletOrderUpdate[],
): Promise<void> {
  if (updates.length === 0) return;

  const storedById = await loadOwnerWallets(ownerId);
  const now = new Date().toISOString();
  const batch = writeBatch(db);
  let writes = 0;

  for (const update of updates) {
    const storedWallet = storedById.get(update.id);
    if (!storedWallet) continue;

    batch.update(doc(db, WALLET_COLLECTION, update.id), {
      sortOrder: update.sortOrder,
      updatedAt: now,
      revision: nextRevision(storedWallet),
    });
    writes += 1;
  }

  if (writes === 0) return;

  await batch.commit();
}
