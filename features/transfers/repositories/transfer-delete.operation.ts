import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { nextRevision } from "@/shared/utils/revision";
import {
  assertExpectedRevision,
  writeAppliedMutation,
  type SyncMutationContext,
} from "@/shared/services/sync/firestore-idempotency";

import { TransferOperationError } from "../services/transfer.errors";
import { Transfer } from "../types/transfer.types";
import { mapTransferDocument } from "./transfer.mapper";
import { readTransferReplay } from "./transfer-mutation.replay";
import { revertTransferWallets } from "./transfer-delete.revert";
import { TransferMutationResult } from "./transfer.repository";

/** Soft-deletes a transfer and reverts the balance on both wallets. */
export async function deleteTransferOperation(
  ownerId: string,
  transferId: string,
  mutation?: SyncMutationContext,
): Promise<TransferMutationResult> {
  const now = new Date().toISOString();
  const transferRef = doc(db, "transfers", transferId);

  let deletedTransfer: Transfer | null = null;
  let updatedWallets: Wallet[] = [];
  let replayedWallets: Wallet[] = [];
  let replayed = false;

  await runTransaction(db, async (firestoreTransaction) => {
    if (mutation) {
      const replay = await readTransferReplay(
        firestoreTransaction,
        transferRef,
        ownerId,
        mutation,
      );
      if (replay.replayed) {
        replayed = true;
        deletedTransfer = replay.transfer;
        replayedWallets = replay.wallets;
        return;
      }
    }

    const transferSnapshot = await firestoreTransaction.get(transferRef);
    if (!transferSnapshot.exists()) {
      throw new TransferOperationError("TRANSFER_NOT_FOUND");
    }

    const transferData = transferSnapshot.data() as Record<string, unknown>;
    if (transferData.ownerId !== ownerId) {
      throw new TransferOperationError("TRANSFER_NOT_FOUND");
    }

    const previous = mapTransferDocument(transferId, transferData, ownerId);
    if (!previous) {
      throw new TransferOperationError("TRANSFER_INVALID");
    }
    if (previous.deletedAt) {
      // The server is already in the state a queued delete wants; only the
      // online path keeps reporting the record as not found.
      if (mutation) {
        replayed = true;
        deletedTransfer = previous;
        return;
      }

      throw new TransferOperationError("TRANSFER_NOT_FOUND");
    }

    if (mutation) assertExpectedRevision(transferData, mutation);

    updatedWallets = await revertTransferWallets({
      firestoreTransaction,
      ownerId,
      now,
      previous,
    });

    const revision = nextRevision(previous);
    firestoreTransaction.update(transferRef, {
      deletedAt: now,
      updatedAt: now,
      revision,
    });

    deletedTransfer = {
      ...previous,
      deletedAt: now,
      updatedAt: now,
      revision,
    };

    if (mutation) {
      writeAppliedMutation(firestoreTransaction, {
        ownerId,
        context: mutation,
        entityType: "transfer",
        entityId: transferId,
        revisionAfter: revision,
        now,
      });
    }
  });

  if (!deletedTransfer) {
    throw new TransferOperationError("TRANSFER_NOT_FOUND");
  }

  if (replayed) return { transfer: deletedTransfer, wallets: replayedWallets };

  return { transfer: deletedTransfer, wallets: updatedWallets };
}
