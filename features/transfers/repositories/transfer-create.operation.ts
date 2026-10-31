import {
  collection,
  doc,
  runTransaction,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { mapWalletDocument } from "@/features/wallets/repositories/wallet.mapper";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { TransferOperationError } from "../services/transfer.errors";
import { CreateTransferDto } from "../types/transfer.types";
import { applyTransferToBalances, hasSufficientBalance } from "../utils/transfer-balance";
import {
  buildTransfer,
  toTransferData,
  toWalletBalance,
} from "./transfer-firestore.utils";
import { TransferMutationResult } from "./transfer.repository";

/** Creates a transfer and moves the balance between both wallets atomically. */
export async function createTransferOperation(
  ownerId: string,
  dto: CreateTransferDto,
): Promise<TransferMutationResult> {
  const now = new Date().toISOString();
  const transfersRef = collection(db, "transfers");
  const fromWalletRef = doc(db, "wallets", dto.fromWalletId);
  const toWalletRef = doc(db, "wallets", dto.toWalletId);

  let createdId = "";
  let updatedWallets: Wallet[] = [];

  await runTransaction(db, async (firestoreTransaction) => {
    if (dto.fromWalletId === dto.toWalletId) {
      throw new TransferOperationError("SAME_WALLET");
    }
    if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
      throw new TransferOperationError("TRANSFER_INVALID");
    }

    const fromWalletSnapshot = await firestoreTransaction.get(fromWalletRef);
    if (!fromWalletSnapshot.exists()) {
      throw new TransferOperationError("FROM_WALLET_NOT_FOUND");
    }

    const toWalletSnapshot = await firestoreTransaction.get(toWalletRef);
    if (!toWalletSnapshot.exists()) {
      throw new TransferOperationError("TO_WALLET_NOT_FOUND");
    }

    const fromWalletData =
      fromWalletSnapshot.data() as Record<string, unknown>;
    const toWalletData = toWalletSnapshot.data() as Record<string, unknown>;

    if (
      fromWalletData.ownerId !== ownerId ||
      toWalletData.ownerId !== ownerId
    ) {
      throw new TransferOperationError("WALLET_NOT_OWNED");
    }

    if (
      fromWalletData.currency !== dto.currency ||
      toWalletData.currency !== dto.currency
    ) {
      throw new TransferOperationError("CURRENCY_MISMATCH");
    }

    const fromBalance = toWalletBalance(fromWalletData);
    if (!hasSufficientBalance(fromBalance, dto.amount)) {
      throw new TransferOperationError("INSUFFICIENT_FUNDS");
    }

    const nextBalances = applyTransferToBalances(
      fromBalance,
      toWalletBalance(toWalletData),
      dto.amount,
    );

    const updatedFromWallet = mapWalletDocument(
      dto.fromWalletId,
      {
        ...fromWalletData,
        balance: nextBalances.fromBalance,
        updatedAt: now,
      },
      ownerId,
    );
    const updatedToWallet = mapWalletDocument(
      dto.toWalletId,
      {
        ...toWalletData,
        balance: nextBalances.toBalance,
        updatedAt: now,
      },
      ownerId,
    );

    updatedWallets = [];
    if (updatedFromWallet) updatedWallets.push(updatedFromWallet);
    if (updatedToWallet) updatedWallets.push(updatedToWallet);

    const transferRef = doc(transfersRef);
    createdId = transferRef.id;

    firestoreTransaction.set(transferRef, toTransferData(ownerId, dto, now));
    firestoreTransaction.update(fromWalletRef, {
      balance: nextBalances.fromBalance,
      updatedAt: now,
    });
    firestoreTransaction.update(toWalletRef, {
      balance: nextBalances.toBalance,
      updatedAt: now,
    });
  });

  return {
    transfer: buildTransfer(createdId, ownerId, dto, now, now),
    wallets: updatedWallets,
  };
}
