import { deleteField, doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { toIsoTimestamp } from "@/shared/utils/date";
import { nextRevision } from "@/shared/utils/revision";
import {
  assertExpectedRevision,
  writeAppliedMutation,
  type SyncMutationContext,
} from "@/shared/services/sync/firestore-idempotency";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { TransferOperationError } from "../services/transfer.errors";
import { Transfer, UpdateTransferDto } from "../types/transfer.types";
import { mapTransferDocument } from "./transfer.mapper";
import { readTransferReplay } from "./transfer-mutation.replay";
import { buildTransfer, toTransferData } from "./transfer-firestore.utils";
import { applyTransferUpdate } from "./transfer-update.apply";
import { TransferMutationResult } from "./transfer.repository";

export interface UpdateTransferOperationOptions {
  ownerId: string;
  transferId: string;
  dto: UpdateTransferDto;
  /** Present only when the sync engine pushes a queued mutation. */
  mutation?: SyncMutationContext;
}

/** Replaces a transfer, reverting the previous balances before applying it. */
export async function updateTransferOperation({
  ownerId,
  transferId,
  dto,
  mutation,
}: UpdateTransferOperationOptions): Promise<TransferMutationResult> {
  const now = new Date().toISOString();
  const transferRef = doc(db, "transfers", transferId);

  let updatedTransfer: Transfer | null = null;
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
        updatedTransfer = replay.transfer;
        replayedWallets = replay.wallets;
        return;
      }
    }

    if (dto.fromWalletId === dto.toWalletId) {
      throw new TransferOperationError("SAME_WALLET");
    }
    if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
      throw new TransferOperationError("TRANSFER_INVALID");
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
      throw new TransferOperationError("TRANSFER_NOT_FOUND");
    }

    if (mutation) assertExpectedRevision(transferData, mutation);

    const previousCreatedAt = toIsoTimestamp(previous.createdAt) ?? now;

    updatedWallets = await applyTransferUpdate({
      firestoreTransaction,
      ownerId,
      now,
      previous,
      dto,
    });

    const revision = nextRevision(previous);
    firestoreTransaction.update(transferRef, {
      ...toTransferData(ownerId, dto, now),
      revision,
      fromWalletName: deleteField(),
      toWalletName: deleteField(),
      createdAt: previousCreatedAt,
    });

    updatedTransfer = buildTransfer(
      transferId,
      ownerId,
      dto,
      previousCreatedAt,
      now,
      revision,
    );

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

  if (!updatedTransfer) {
    throw new TransferOperationError("TRANSFER_NOT_FOUND");
  }

  if (replayed) return { transfer: updatedTransfer, wallets: replayedWallets };

  return { transfer: updatedTransfer, wallets: updatedWallets };
}
