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

import type { Transfer } from "../types/transfer.types";
import { mapTransferDocument } from "./transfer.mapper";

export type TransferReplay = {
  replayed: boolean;
  transfer: Transfer | null;
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
 * First read of a queued transfer mutation: an existing marker means the server
 * already applied it, so the operation returns the stored record and its wallets
 * instead of moving the balances twice.
 */
export async function readTransferReplay(
  firestoreTransaction: FirestoreTransaction,
  transferRef: DocumentReference,
  ownerId: string,
  mutation: SyncMutationContext,
): Promise<TransferReplay> {
  const revision = await readAppliedRevision(
    firestoreTransaction,
    ownerId,
    mutation,
  );
  if (revision === null) {
    return { replayed: false, transfer: null, wallets: [] };
  }

  const snapshot = await firestoreTransaction.get(transferRef);
  const transfer = snapshot.exists()
    ? mapTransferDocument(
        transferRef.id,
        snapshot.data() as Record<string, unknown>,
        ownerId,
      )
    : null;

  if (!transfer) return { replayed: true, transfer: null, wallets: [] };

  const wallets = [
    ...(await readReplayWallet(
      firestoreTransaction,
      transfer.fromWalletId,
      ownerId,
    )),
    ...(await readReplayWallet(
      firestoreTransaction,
      transfer.toWalletId,
      ownerId,
    )),
  ];

  return { replayed: true, transfer, wallets };
}
