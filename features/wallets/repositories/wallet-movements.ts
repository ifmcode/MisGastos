import {
  collection,
  getDocs,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { WalletUsage } from "../types/wallet.types";
import { isSoftDeletedMovement } from "./wallet-delete.helpers";

export interface WalletMovements {
  transactions: QueryDocumentSnapshot[];
  transfers: QueryDocumentSnapshot[];
}

function readString(
  data: Record<string, unknown>,
  key: string,
): string {
  const value = data[key];
  return typeof value === "string" ? value : "";
}

/**
 * Loads the movements that reference a wallet. Queries stay owner-scoped (the
 * only index required today) and the wallet id is filtered in memory.
 */
export async function loadWalletMovements(
  ownerId: string,
  walletId: string,
): Promise<WalletMovements> {
  const [transactionSnapshot, transferSnapshot] = await Promise.all([
    getDocs(
      query(
        collection(db, "transactions"),
        where("ownerId", "==", ownerId),
      ),
    ),
    getDocs(query(collection(db, "transfers"), where("ownerId", "==", ownerId))),
  ]);

  const transactions = transactionSnapshot.docs.filter(
    (document) =>
      readString(document.data() as Record<string, unknown>, "walletId") ===
      walletId,
  );

  const transfers = transferSnapshot.docs.filter((document) => {
    const data = document.data() as Record<string, unknown>;
    if (data.deletedAt) return false;

    return (
      readString(data, "fromWalletId") === walletId ||
      readString(data, "toWalletId") === walletId
    );
  });

  return { transactions, transfers };
}

export function toWalletUsage(movements: WalletMovements): WalletUsage {
  // Soft-deleted movements were already reverted, so they no longer count as
  // usage; keeping them in the document keeps the history references valid.
  const transactionCount = movements.transactions.filter(
    (document) =>
      !isSoftDeletedMovement(document.data() as Record<string, unknown>),
  ).length;
  const transferCount = movements.transfers.length;

  return {
    transactionCount,
    transferCount,
    hasMovements: transactionCount + transferCount > 0,
  };
}
