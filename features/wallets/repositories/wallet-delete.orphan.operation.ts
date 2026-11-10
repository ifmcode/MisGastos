import { doc, writeBatch } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { Wallet } from "../types/wallet.types";
import {
  getDeletedWalletName,
  ORPHANED_WALLET_ID,
} from "../utils/deleted-wallet";
import { WalletMovements } from "./wallet-movements";
import { assertBatchSize, readString } from "./wallet-delete.helpers";

/** Keeps history, moves it to the virtual wallet and deletes the wallet. */
export async function orphanWalletMovementsAndDelete(
  wallet: Wallet,
  movements: WalletMovements,
): Promise<void> {
  const now = new Date().toISOString();
  const deletedName = getDeletedWalletName(wallet.name);
  const batch = writeBatch(db);
  let writes = 1;

  for (const document of movements.transactions) {
    batch.update(document.ref, {
      walletId: ORPHANED_WALLET_ID,
      walletName: deletedName,
      updatedAt: now,
    });
    writes += 1;
  }

  for (const document of movements.transfers) {
    const data = document.data() as Record<string, unknown>;
    const patch: Record<string, unknown> = { updatedAt: now };

    if (readString(data, "fromWalletId") === wallet.id) {
      patch.fromWalletId = ORPHANED_WALLET_ID;
      patch.fromWalletName = deletedName;
    }
    if (readString(data, "toWalletId") === wallet.id) {
      patch.toWalletId = ORPHANED_WALLET_ID;
      patch.toWalletName = deletedName;
    }

    batch.update(document.ref, patch);
    writes += 1;
  }

  assertBatchSize(writes);
  batch.delete(doc(db, "wallets", wallet.id));
  await batch.commit();
}
