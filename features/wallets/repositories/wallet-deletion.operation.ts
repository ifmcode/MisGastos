import { deleteDoc, doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { WalletOperationError } from "../services/wallet.errors";
import {
  DeleteWalletOptions,
  Wallet,
  WalletDeletionResult,
} from "../types/wallet.types";
import { mapWalletDocument } from "./wallet.mapper";
import { orphanWalletMovementsAndDelete } from "./wallet-delete.orphan.operation";
import { reassignWalletMovementsAndDelete } from "./wallet-delete.reassign.operation";
import { loadWalletMovements } from "./wallet-movements";

const WALLET_COLLECTION = "wallets";

async function loadOwnedWallet(
  ownerId: string,
  walletId: string,
): Promise<Wallet | null> {
  const snapshot = await getDoc(doc(db, WALLET_COLLECTION, walletId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as Record<string, unknown>;
  if (data.ownerId !== ownerId) return null;

  return mapWalletDocument(snapshot.id, data, ownerId);
}

/**
 * Deletes a wallet, orphaning its movements or moving them to a validated
 * target. Guard checks live in the service; ownership is rechecked here.
 */
export async function deleteWalletDocument(
  ownerId: string,
  walletId: string,
  options: DeleteWalletOptions,
): Promise<WalletDeletionResult> {
  const wallet = await loadOwnedWallet(ownerId, walletId);
  if (!wallet) throw new WalletOperationError("WALLET_NOT_FOUND");

  const movements = await loadWalletMovements(ownerId, walletId);
  const hasMovements =
    movements.transactions.length + movements.transfers.length > 0;

  if (!hasMovements) {
    await deleteDoc(doc(db, WALLET_COLLECTION, walletId));
    return { deletedWalletId: walletId };
  }

  if (options.mode === "keep") {
    await orphanWalletMovementsAndDelete(wallet, movements);
    return { deletedWalletId: walletId };
  }

  const targetWalletId = options.targetWalletId?.trim() ?? "";
  if (targetWalletId.length === 0) {
    throw new WalletOperationError("TARGET_WALLET_REQUIRED");
  }
  if (targetWalletId === walletId) {
    throw new WalletOperationError("TARGET_WALLET_SAME");
  }

  const target = await loadOwnedWallet(ownerId, targetWalletId);
  if (!target) throw new WalletOperationError("TARGET_WALLET_NOT_FOUND");
  if (target.archivedAt) {
    throw new WalletOperationError("TARGET_WALLET_ARCHIVED");
  }
  if (target.currency !== wallet.currency) {
    throw new WalletOperationError("TARGET_WALLET_CURRENCY_MISMATCH");
  }

  const updatedTarget = await reassignWalletMovementsAndDelete(
    ownerId,
    wallet,
    target,
    movements,
  );

  return { deletedWalletId: walletId, targetWallet: updatedTarget };
}
