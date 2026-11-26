import {
  doc,
  type DocumentReference,
  type Transaction as FirestoreTransaction,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { mapWalletDocument } from "@/features/wallets/repositories/wallet.mapper";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";
import {
  readAppliedRevision,
  type SyncMutationContext,
} from "@/shared/services/sync/firestore-idempotency";

import type { Transaction } from "../types/transaction.types";
import { mapTransactionDocument } from "./transaction.mapper";

export type TransactionReplay = {
  replayed: boolean;
  transaction: Transaction | null;
  /** Wallets the replay already moved, so the local derived balance stays right. */
  wallets: Wallet[];
};

async function readReplayWallet(
  firestoreTransaction: FirestoreTransaction,
  walletId: string,
  ownerId: string,
): Promise<Wallet[]> {
  if (isOrphanedWalletId(walletId)) return [];

  const snapshot = await firestoreTransaction.get(doc(db, "wallets", walletId));
  if (!snapshot.exists()) return [];

  const wallet = mapWalletDocument(
    walletId,
    snapshot.data() as Record<string, unknown>,
    ownerId,
  );

  return wallet ? [wallet] : [];
}

/**
 * First read of a queued mutation: when its marker exists the server already
 * applied it (crash after commit or lost ack), so the operation returns the
 * stored movement and its wallet instead of touching money again.
 */
export async function readTransactionReplay(
  firestoreTransaction: FirestoreTransaction,
  transactionRef: DocumentReference,
  ownerId: string,
  mutation: SyncMutationContext,
): Promise<TransactionReplay> {
  const revision = await readAppliedRevision(
    firestoreTransaction,
    ownerId,
    mutation,
  );
  if (revision === null) {
    return { replayed: false, transaction: null, wallets: [] };
  }

  const snapshot = await firestoreTransaction.get(transactionRef);
  const transaction = snapshot.exists()
    ? mapTransactionDocument(
        transactionRef.id,
        snapshot.data() as Record<string, unknown>,
        ownerId,
      )
    : null;

  if (!transaction) {
    return { replayed: true, transaction: null, wallets: [] };
  }

  return {
    replayed: true,
    transaction,
    wallets: await readReplayWallet(
      firestoreTransaction,
      transaction.walletId,
      ownerId,
    ),
  };
}
