import { deleteField, doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { toIsoTimestamp } from "@/shared/utils/date";
import { nextRevision } from "@/shared/utils/revision";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { TransferOperationError } from "../services/transfer.errors";
import { Transfer, UpdateTransferDto } from "../types/transfer.types";
import { mapTransferDocument } from "./transfer.mapper";
import {
  addBalanceAdjustment,
  buildTransfer,
  loadTransferWallets,
  toTransferData,
} from "./transfer-firestore.utils";
import { applyTransferBalanceUpdates } from "./transfer-update.balances";
import { TransferMutationResult } from "./transfer.repository";

export interface UpdateTransferOperationOptions {
  ownerId: string;
  transferId: string;
  dto: UpdateTransferDto;
}

/** Replaces a transfer, reverting the previous balances before applying it. */
export async function updateTransferOperation({
  ownerId,
  transferId,
  dto,
}: UpdateTransferOperationOptions): Promise<TransferMutationResult> {
  const now = new Date().toISOString();
  const transferRef = doc(db, "transfers", transferId);

  let updatedTransfer: Transfer | null = null;
  let updatedWallets: Wallet[] = [];

  await runTransaction(db, async (firestoreTransaction) => {
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

    const previousCreatedAt = toIsoTimestamp(previous.createdAt) ?? now;

    const walletIds = Array.from(
      new Set([
        previous.fromWalletId,
        previous.toWalletId,
        dto.fromWalletId,
        dto.toWalletId,
      ]),
    );

    const walletDataById = await loadTransferWallets({
      transaction: firestoreTransaction,
      ownerId,
      walletIds,
      fromWalletId: dto.fromWalletId,
      toWalletId: dto.toWalletId,
      previousFromWalletId: previous.fromWalletId,
    });

    const nextFromWallet = walletDataById.get(dto.fromWalletId) ?? {};
    const nextToWallet = walletDataById.get(dto.toWalletId) ?? {};

    if (
      nextFromWallet.currency !== dto.currency ||
      nextToWallet.currency !== dto.currency
    ) {
      throw new TransferOperationError("CURRENCY_MISMATCH");
    }

    const adjustments = new Map<string, number>();
    addBalanceAdjustment(adjustments, previous.fromWalletId, previous.amount);
    addBalanceAdjustment(
      adjustments,
      previous.toWalletId,
      -previous.amount,
    );
    addBalanceAdjustment(adjustments, dto.fromWalletId, -dto.amount);
    addBalanceAdjustment(adjustments, dto.toWalletId, dto.amount);

    updatedWallets = applyTransferBalanceUpdates({
      transaction: firestoreTransaction,
      ownerId,
      now,
      walletIds,
      walletDataById,
      adjustments,
      fromWalletId: dto.fromWalletId,
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
  });

  if (!updatedTransfer) {
    throw new TransferOperationError("TRANSFER_NOT_FOUND");
  }

  return { transfer: updatedTransfer, wallets: updatedWallets };
}
