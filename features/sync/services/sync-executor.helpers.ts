import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import type {
  OutboxEntityType,
  OutboxMutation,
} from "@/shared/lib/local-db/local-db.types";
import type { SyncMutationContext } from "@/shared/services/sync/firestore-idempotency";
import type { RemoteWalletBalance } from "@/shared/services/sync/sync.types";

const COLLECTION_BY_ENTITY: Partial<Record<OutboxEntityType, string>> = {
  transaction: "transactions",
  transfer: "transfers",
};

export function toMutationContext(
  mutation: OutboxMutation,
): SyncMutationContext {
  return {
    clientMutationId: mutation.clientMutationId,
    baseRevision: mutation.baseRevision,
  };
}

export function toRemoteWallets(
  wallets: readonly Wallet[],
): RemoteWalletBalance[] {
  return wallets.map((wallet) => ({
    id: wallet.id,
    balance: wallet.balance,
    revision: wallet.revision,
    updatedAt:
      typeof wallet.updatedAt === "string" ? wallet.updatedAt : undefined,
  }));
}

/** Remote document for the conflict UI; null when it cannot be read. */
export async function readRemoteSnapshot(
  mutation: OutboxMutation,
): Promise<Record<string, unknown> | null> {
  const collectionName = COLLECTION_BY_ENTITY[mutation.entityType];
  if (!collectionName) return {};

  try {
    const snapshot = await getDoc(doc(db, collectionName, mutation.entityId));

    return snapshot.exists()
      ? (snapshot.data() as Record<string, unknown>)
      : {};
  } catch {
    return null;
  }
}
