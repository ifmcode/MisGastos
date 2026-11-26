import { deleteField, doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";
import { roundMoney } from "@/shared/utils/money";
import { toIsoTimestamp } from "@/shared/utils/date";
import { nextRevision } from "@/shared/utils/revision";

import { TransactionOperationError } from "../services/transaction.errors";
import { Transaction, UpdateTransactionDto } from "../types/transaction.types";
import {
  buildTransaction,
  getMappedWallet,
  toTransactionData,
} from "./transaction-firestore.utils";
import {
  readStoredDeletedAt,
  readStoredGroupExpenseId,
  readStoredGroupSettlementId,
  readStoredSharedExpenseId,
} from "./transaction-stored.utils";
import { applyTransactionWalletAdjustment } from "./transaction-update.wallets";
import { TransactionMutationResult } from "./transaction.repository";

export interface UpdateTransactionOperationOptions {
  ownerId: string;
  transactionId: string;
  dto: UpdateTransactionDto;
}

/**
 * Updates a transaction, reverting the stored movement from its original
 * wallet before applying the new one.
 */
export async function updateTransactionOperation({
  ownerId,
  transactionId,
  dto,
}: UpdateTransactionOperationOptions): Promise<TransactionMutationResult> {
  const now = new Date().toISOString();
  const transactionRef = doc(db, "transactions", transactionId);
  const newWalletRef = doc(db, "wallets", dto.walletId);

  let updatedTransaction: Transaction | null = null;

  await runTransaction(db, async (firestoreTransaction) => {
    const transactionSnapshot = await firestoreTransaction.get(transactionRef);
    if (!transactionSnapshot.exists()) {
      throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
    }

    const transactionData =
      transactionSnapshot.data() as Record<string, unknown>;
    if (transactionData.ownerId !== ownerId) {
      throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
    }

    // A soft-deleted movement already reverted its amount; editing it would
    // apply the money again while it stays out of the history.
    if (readStoredDeletedAt(transactionData) !== null) {
      throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
    }

    const previousType = transactionData.type;
    const previousAmount =
      typeof transactionData.amount === "number"
        ? roundMoney(transactionData.amount)
        : null;
    const previousWalletId =
      typeof transactionData.walletId === "string"
        ? transactionData.walletId
        : "";

    if (previousType !== "expense" && previousType !== "income") {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }
    if (previousAmount === null || previousAmount <= 0) {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }
    if (previousWalletId.length === 0) {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }

    await applyTransactionWalletAdjustment(
      firestoreTransaction,
      ownerId,
      now,
      { type: previousType, amount: previousAmount, walletId: previousWalletId },
      {
        type: dto.type,
        amount: dto.amount,
        walletId: dto.walletId,
        currency: dto.currency,
      },
    );

    const revision = nextRevision(transactionData);

    const patch: Record<string, unknown> = {
      ...toTransactionData(ownerId, dto, now, revision),
      createdAt: toIsoTimestamp(transactionData.createdAt) ?? now,
      // A personal edit keeps the stored soft-delete stamp untouched. It is
      // always null here because a deleted movement is rejected above.
      deletedAt: readStoredDeletedAt(transactionData),
    };

    const sharedExpenseId = readStoredSharedExpenseId(transactionData);
    if (sharedExpenseId) patch.sharedExpenseId = sharedExpenseId;

    const groupExpenseId = readStoredGroupExpenseId(transactionData);
    if (groupExpenseId) patch.groupExpenseId = groupExpenseId;

    const groupSettlementId = readStoredGroupSettlementId(transactionData);
    if (groupSettlementId) patch.groupSettlementId = groupSettlementId;

    if (!(previousWalletId === dto.walletId && isOrphanedWalletId(previousWalletId))) {
      patch.walletName = deleteField();
    }

    firestoreTransaction.update(transactionRef, patch);
    updatedTransaction = buildTransaction(
      transactionId,
      ownerId,
      dto,
      now,
      revision,
    );
  });

  if (!updatedTransaction) {
    throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
  }

  const updatedWallet = await getMappedWallet(newWalletRef, ownerId);
  const wallets: Wallet[] = updatedWallet ? [updatedWallet] : [];

  return {
    transaction: updatedTransaction,
    wallets,
  };
}
