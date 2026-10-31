import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { mapWalletDocument } from "@/features/wallets/repositories/wallet.mapper";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { roundMoney } from "@/features/wallets/utils/money";

import { TransferOperationError } from "../services/transfer.errors";
import { Transfer } from "../types/transfer.types";
import { mapTransferDocument } from "./transfer.mapper";
import { toWalletBalance } from "./transfer-firestore.utils";
import { TransferMutationResult } from "./transfer.repository";

/** Soft-deletes a transfer and reverts the balance on both wallets. */
export async function deleteTransferOperation(
  ownerId: string,
  transferId: string,
): Promise<TransferMutationResult> {
  const now = new Date().toISOString();
  const transferRef = doc(db, "transfers", transferId);

  let deletedTransfer: Transfer | null = null;
  let updatedWallets: Wallet[] = [];

  await runTransaction(db, async (firestoreTransaction) => {
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

    const fromWalletRef = doc(db, "wallets", previous.fromWalletId);
    const toWalletRef = doc(db, "wallets", previous.toWalletId);

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

    const fromBalance = roundMoney(
      toWalletBalance(fromWalletData) + previous.amount,
    );
    const toBalance = roundMoney(
      toWalletBalance(toWalletData) - previous.amount,
    );

    firestoreTransaction.update(fromWalletRef, {
      balance: fromBalance,
      updatedAt: now,
    });
    firestoreTransaction.update(toWalletRef, {
      balance: toBalance,
      updatedAt: now,
    });
    firestoreTransaction.update(transferRef, {
      deletedAt: now,
      updatedAt: now,
    });

    const updatedFromWallet = mapWalletDocument(
      previous.fromWalletId,
      { ...fromWalletData, balance: fromBalance, updatedAt: now },
      ownerId,
    );
    const updatedToWallet = mapWalletDocument(
      previous.toWalletId,
      { ...toWalletData, balance: toBalance, updatedAt: now },
      ownerId,
    );

    updatedWallets = [];
    if (updatedFromWallet) updatedWallets.push(updatedFromWallet);
    if (updatedToWallet) updatedWallets.push(updatedToWallet);

    deletedTransfer = { ...previous, deletedAt: now, updatedAt: now };
  });

  if (!deletedTransfer) {
    throw new TransferOperationError("TRANSFER_NOT_FOUND");
  }

  return { transfer: deletedTransfer, wallets: updatedWallets };
}
