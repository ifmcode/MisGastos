import { collection, doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { readClientDocumentId } from "@/shared/utils/client-id";
import { INITIAL_REVISION, nextRevision } from "@/shared/utils/revision";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { roundMoney } from "@/shared/utils/money";

import { TransactionOperationError } from "../services/transaction.errors";
import {
  CreateTransactionDto,
  Transaction,
} from "../types/transaction.types";
import { getSignedTransactionAmount } from "@/shared/utils/transaction-balance";
import {
  buildTransaction,
  getMappedWallet,
  toTransactionData,
  toWalletBalance,
} from "./transaction-firestore.utils";
import { TransactionMutationResult } from "./transaction.repository";

/** Creates a transaction and applies its signed amount to the wallet balance. */
export async function createTransactionOperation(
  ownerId: string,
  dto: CreateTransactionDto,
): Promise<TransactionMutationResult> {
  const now = new Date().toISOString();
  const transactionsRef = collection(db, "transactions");
  const walletRef = doc(db, "wallets", dto.walletId);

  let createdId = "";

  await runTransaction(db, async (firestoreTransaction) => {
    const walletSnapshot = await firestoreTransaction.get(walletRef);
    if (!walletSnapshot.exists()) {
      throw new TransactionOperationError("WALLET_NOT_FOUND");
    }

    const walletData = walletSnapshot.data() as Record<string, unknown>;
    if (walletData.ownerId !== ownerId) {
      throw new TransactionOperationError("WALLET_NOT_OWNED");
    }
    if (walletData.currency !== dto.currency) {
      throw new TransactionOperationError("CURRENCY_MISMATCH");
    }

    const currentBalance = toWalletBalance(walletData);
    const nextBalance = roundMoney(
      currentBalance +
        getSignedTransactionAmount({ type: dto.type, amount: dto.amount }),
    );

    const providedId = readClientDocumentId(dto.id);
    const transactionRef = providedId
      ? doc(db, "transactions", providedId)
      : doc(transactionsRef);
    createdId = transactionRef.id;

    firestoreTransaction.set(
      transactionRef,
      toTransactionData(ownerId, dto, now, INITIAL_REVISION),
    );
    firestoreTransaction.update(walletRef, {
      balance: nextBalance,
      updatedAt: now,
      revision: nextRevision(walletData),
    });
  });

  const updatedWallet = await getMappedWallet(walletRef, ownerId);
  const wallets: Wallet[] = updatedWallet ? [updatedWallet] : [];

  return {
    transaction: buildTransaction(
      createdId,
      ownerId,
      dto,
      now,
      INITIAL_REVISION,
    ),
    wallets,
  };
}
