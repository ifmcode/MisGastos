import { deleteField, doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { WalletOperationError } from "../services/wallet.errors";
import { Wallet } from "../types/wallet.types";
import {
  getDeletedWalletName,
  ORPHANED_WALLET_ID,
} from "../utils/deleted-wallet";
import { roundMoney } from "../utils/money";
import { WalletMovements } from "./wallet-movements";
import {
  assertBatchSize,
  getSignedAmount,
  readAmount,
  readBalance,
  readString,
} from "./wallet-delete.helpers";

/**
 * Moves movements to a compatible wallet and applies the resulting balance on
 * that wallet. Transfers whose counterpart is the target stay orphaned because
 * a transfer cannot have the same wallet on both sides.
 */
export async function reassignWalletMovementsAndDelete(
  ownerId: string,
  wallet: Wallet,
  target: Wallet,
  movements: WalletMovements,
): Promise<Wallet> {
  const now = new Date().toISOString();
  const deletedName = getDeletedWalletName(wallet.name);
  const targetRef = doc(db, "wallets", target.id);
  let updatedTarget: Wallet | null = null;

  await runTransaction(db, async (transaction) => {
    const targetSnapshot = await transaction.get(targetRef);
    if (!targetSnapshot.exists()) {
      throw new WalletOperationError("WALLET_NOT_FOUND");
    }

    const targetData = targetSnapshot.data() as Record<string, unknown>;
    if (targetData.ownerId !== ownerId) {
      throw new WalletOperationError("WALLET_NOT_FOUND");
    }
    if (targetData.archivedAt) {
      throw new WalletOperationError("TARGET_WALLET_ARCHIVED");
    }

    let net = 0;
    let writes = 2;

    for (const document of movements.transactions) {
      const data = document.data() as Record<string, unknown>;
      net = roundMoney(net + getSignedAmount(data));
      transaction.update(document.ref, {
        walletId: target.id,
        walletName: deleteField(),
        updatedAt: now,
      });
      writes += 1;
    }

    for (const document of movements.transfers) {
      const data = document.data() as Record<string, unknown>;
      const fromWalletId = readString(data, "fromWalletId");
      const toWalletId = readString(data, "toWalletId");
      const isFrom = fromWalletId === wallet.id;
      const isTo = toWalletId === wallet.id;
      const counterpart = isFrom ? toWalletId : fromWalletId;
      const patch: Record<string, unknown> = { updatedAt: now };

      if (counterpart === target.id) {
        if (isFrom) {
          patch.fromWalletId = ORPHANED_WALLET_ID;
          patch.fromWalletName = deletedName;
        }
        if (isTo) {
          patch.toWalletId = ORPHANED_WALLET_ID;
          patch.toWalletName = deletedName;
        }
      } else if (isFrom) {
        net = roundMoney(net - readAmount(data.amount));
        patch.fromWalletId = target.id;
        patch.fromWalletName = deleteField();
      } else if (isTo) {
        net = roundMoney(net + readAmount(data.amount));
        patch.toWalletId = target.id;
        patch.toWalletName = deleteField();
      }

      transaction.update(document.ref, patch);
      writes += 1;
    }

    const nextBalance = roundMoney(readBalance(targetData) + net);
    if (nextBalance < 0) {
      throw new WalletOperationError("TARGET_WALLET_INSUFFICIENT_BALANCE");
    }

    assertBatchSize(writes);

    transaction.update(targetRef, {
      balance: nextBalance,
      updatedAt: now,
    });
    transaction.delete(doc(db, "wallets", wallet.id));

    updatedTarget = { ...target, balance: nextBalance, updatedAt: now };
  });

  if (!updatedTarget) {
    throw new WalletOperationError("WALLET_NOT_FOUND");
  }

  return updatedTarget;
}
