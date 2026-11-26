import { collection, doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { readClientDocumentId } from "@/shared/utils/client-id";
import { INITIAL_REVISION } from "@/shared/utils/revision";
import {
  writeAppliedMutation,
  type SyncMutationContext,
} from "@/shared/services/sync/firestore-idempotency";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { TransferOperationError } from "../services/transfer.errors";
import { CreateTransferDto, Transfer } from "../types/transfer.types";
import { applyTransferCreation } from "./transfer-create.balances";
import { buildTransfer, toTransferData } from "./transfer-firestore.utils";
import { readTransferReplay } from "./transfer-mutation.replay";
import { TransferMutationResult } from "./transfer.repository";

/**
 * Creates a transfer and moves the balance between both wallets atomically.
 * With a `mutation` context the operation is replay-safe against the
 * `appliedMutations` marker.
 */
export async function createTransferOperation(
  ownerId: string,
  dto: CreateTransferDto,
  mutation?: SyncMutationContext,
): Promise<TransferMutationResult> {
  const now = new Date().toISOString();
  const providedId = readClientDocumentId(dto.id);
  const transferRef = providedId
    ? doc(db, "transfers", providedId)
    : doc(collection(db, "transfers"));

  let replayed = false;
  let replayedTransfer: Transfer | null = null;
  let replayedWallets: Wallet[] = [];
  let updatedWallets: Wallet[] = [];

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
        replayedTransfer = replay.transfer;
        replayedWallets = replay.wallets;
        return;
      }
    }

    updatedWallets = await applyTransferCreation({
      firestoreTransaction,
      ownerId,
      dto,
      now,
    });

    firestoreTransaction.set(transferRef, toTransferData(ownerId, dto, now));

    if (mutation) {
      writeAppliedMutation(firestoreTransaction, {
        ownerId,
        context: mutation,
        entityType: "transfer",
        entityId: transferRef.id,
        revisionAfter: INITIAL_REVISION,
        now,
      });
    }
  });

  if (replayed) {
    if (!replayedTransfer) {
      throw new TransferOperationError("TRANSFER_INVALID");
    }

    return { transfer: replayedTransfer, wallets: replayedWallets };
  }

  return {
    transfer: buildTransfer(
      transferRef.id,
      ownerId,
      dto,
      now,
      now,
      INITIAL_REVISION,
    ),
    wallets: updatedWallets,
  };
}
