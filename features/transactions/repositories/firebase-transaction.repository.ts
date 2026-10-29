import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { mapWalletDocument } from "@/features/wallets/repositories/wallet.mapper";
import { roundMoney } from "@/features/wallets/utils/money";

import { Wallet } from "@/features/wallets/types/wallet.types";

import {
  TransactionMutationResult,
  ITransactionRepository,
} from "./transaction.repository";
import { mapTransactionDocument } from "./transaction.mapper";
import {
  CreateTransactionDto,
  Transaction,
  TransactionType,
  UpdateTransactionDto,
} from "../types/transaction.types";
import { toIsoTimestamp } from "../utils/transaction-date";
import { TransactionOperationError } from "../services/transaction.errors";

function toWalletBalance(data: Record<string, unknown>): number {
  const balance = data.balance;
  if (typeof balance === "number" && Number.isFinite(balance)) {
    return roundMoney(balance);
  }

  const initialBalance = data.initialBalance;
  if (typeof initialBalance === "number" && Number.isFinite(initialBalance)) {
    return roundMoney(initialBalance);
  }

  return 0;
}

function toTransactionData(
  ownerId: string,
  dto: CreateTransactionDto,
  now: string,
) {
  const data: Record<string, unknown> = {
    type: dto.type,
    amount: roundMoney(dto.amount),
    currency: dto.currency,
    walletId: dto.walletId,
    categoryId: dto.categoryId,
    concept: dto.concept.trim(),
    date: dto.date,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };

  const notes = dto.notes?.trim();
  if (notes) {
    data.notes = notes;
  }

  return data;
}

function buildTransaction(
  id: string,
  ownerId: string,
  dto: CreateTransactionDto,
  now: string,
): Transaction {
  return {
    id,
    type: dto.type,
    amount: roundMoney(dto.amount),
    currency: dto.currency,
    walletId: dto.walletId,
    categoryId: dto.categoryId,
    concept: dto.concept.trim(),
    ...(dto.notes?.trim() ? { notes: dto.notes.trim() } : {}),
    date: dto.date,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };
}

export class FirebaseTransactionRepository implements ITransactionRepository {
  async getTransactions(ownerId: string): Promise<Transaction[]> {
    const transactionsRef = collection(db, "transactions");
    const snapshot = await getDocs(
      query(transactionsRef, where("ownerId", "==", ownerId)),
    );

    const transactions: Transaction[] = [];

    for (const document of snapshot.docs) {
      const transaction = mapTransactionDocument(
        document.id,
        document.data() as Record<string, unknown>,
        ownerId,
      );
      if (transaction) transactions.push(transaction);
    }

    return transactions;
  }

  async createTransaction(
    ownerId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionMutationResult> {
    const now = new Date().toISOString();
    const transactionsRef = collection(db, "transactions");
    const walletRef = doc(db, "wallets", dto.walletId);

    let createdId = "";
    let mappedWallets: Wallet[] = [];

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
        currentBalance + getSignedTransactionAmountObj(dto),
      );

      const transactionRef = doc(transactionsRef);
      createdId = transactionRef.id;

      firestoreTransaction.set(
        transactionRef,
        toTransactionData(ownerId, dto, now),
      );
      firestoreTransaction.update(walletRef, {
        balance: nextBalance,
        updatedAt: now,
      });
    });

    const walletSnapshot = await getDoc(walletRef);
    const updatedWallet = walletSnapshot.exists()
      ? mapWalletDocument(
          walletSnapshot.id,
          walletSnapshot.data() as Record<string, unknown>,
          ownerId,
        )
      : null;

    if (updatedWallet) mappedWallets = [updatedWallet];

    return {
      transaction: buildTransaction(createdId, ownerId, dto, now),
      wallets: mappedWallets,
    };
  }

  async updateTransaction(
    ownerId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionMutationResult> {
    const now = new Date().toISOString();
    const transactionRef = doc(db, "transactions", transactionId);
    const newWalletRef = doc(db, "wallets", dto.walletId);

    let mappedWallets: Wallet[] = [];

    await runTransaction(db, async (firestoreTransaction) => {
      const transactionSnapshot = await firestoreTransaction.get(
        transactionRef,
      );
      if (!transactionSnapshot.exists()) {
        throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
      }

      const transactionData =
        transactionSnapshot.data() as Record<string, unknown>;
      if (transactionData.ownerId !== ownerId) {
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

      if (
        previousType !== "expense" &&
        previousType !== "income"
      ) {
        throw new TransactionOperationError("TRANSACTION_INVALID");
      }
      if (previousAmount === null || previousAmount <= 0) {
        throw new TransactionOperationError("TRANSACTION_INVALID");
      }
      if (previousWalletId.length === 0) {
        throw new TransactionOperationError("TRANSACTION_INVALID");
      }

      const walletSnapshot = await firestoreTransaction.get(newWalletRef);
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

      if (previousWalletId === dto.walletId) {
        const currentBalance = toWalletBalance(walletData);
        const revertedBalance = roundMoney(
          currentBalance - getSignedTransactionAmount(previousType, previousAmount),
        );
        const nextBalance = roundMoney(
          revertedBalance + getSignedTransactionAmount(dto),
        );

        firestoreTransaction.update(newWalletRef, {
          balance: nextBalance,
          updatedAt: now,
        });
      } else {
        const previousWalletRef = doc(db, "wallets", previousWalletId);
        const previousWalletSnapshot =
          await firestoreTransaction.get(previousWalletRef);
        if (!previousWalletSnapshot.exists()) {
          throw new TransactionOperationError("WALLET_NOT_FOUND");
        }
        const previousWalletData =
          previousWalletSnapshot.data() as Record<string, unknown>;
        if (previousWalletData.ownerId !== ownerId) {
          throw new TransactionOperationError("WALLET_NOT_OWNED");
        }

        const currentPreviousBalance = toWalletBalance(previousWalletData);
        const nextPreviousBalance = roundMoney(
          currentPreviousBalance -
            getSignedTransactionAmount(previousType, previousAmount),
        );
        firestoreTransaction.update(previousWalletRef, {
          balance: nextPreviousBalance,
          updatedAt: now,
        });

        const currentNewBalance = toWalletBalance(walletData);
        const nextNewBalance = roundMoney(
          currentNewBalance + getSignedTransactionAmount(dto),
        );
        firestoreTransaction.update(newWalletRef, {
          balance: nextNewBalance,
          updatedAt: now,
        });
      }

      firestoreTransaction.update(transactionRef, {
        ...toTransactionData(ownerId, dto, now),
        createdAt: toIsoTimestamp(transactionData.createdAt) ?? now,
      });
    });

    const walletSnapshot = await getDoc(newWalletRef);
    const updatedWallet = walletSnapshot.exists()
      ? mapWalletDocument(
          walletSnapshot.id,
          walletSnapshot.data() as Record<string, unknown>,
          ownerId,
        )
      : null;

    if (updatedWallet) mappedWallets = [updatedWallet];

    return {
      transaction: buildTransaction(transactionId, ownerId, dto, now),
      wallets: mappedWallets,
    };
  }

  async deleteTransaction(
    ownerId: string,
    transactionId: string,
  ): Promise<TransactionMutationResult> {
    const now = new Date().toISOString();
    const transactionRef = doc(db, "transactions", transactionId);

    let mappedWallets: Wallet[] = [];

    await runTransaction(db, async (firestoreTransaction) => {
      const transactionSnapshot = await firestoreTransaction.get(
        transactionRef,
      );
      if (!transactionSnapshot.exists()) {
        throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
      }

      const transactionData =
        transactionSnapshot.data() as Record<string, unknown>;
      if (transactionData.ownerId !== ownerId) {
        throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
      }

      const type = transactionData.type;
      const amount =
        typeof transactionData.amount === "number"
          ? roundMoney(transactionData.amount)
          : null;
      const walletId =
        typeof transactionData.walletId === "string"
          ? transactionData.walletId
          : "";
      const currency =
        typeof transactionData.currency === "string"
          ? transactionData.currency
          : null;

      if (type !== "expense" && type !== "income") {
        throw new TransactionOperationError("TRANSACTION_INVALID");
      }
      if (amount === null || amount <= 0) {
        throw new TransactionOperationError("TRANSACTION_INVALID");
      }
      if (walletId.length === 0) {
        throw new TransactionOperationError("TRANSACTION_INVALID");
      }

      const walletRef = doc(db, "wallets", walletId);
      const walletSnapshot = await firestoreTransaction.get(walletRef);
      if (!walletSnapshot.exists()) {
        throw new TransactionOperationError("WALLET_NOT_FOUND");
      }

      const walletData = walletSnapshot.data() as Record<string, unknown>;
      if (walletData.ownerId !== ownerId) {
        throw new TransactionOperationError("WALLET_NOT_OWNED");
      }
      if (currency && walletData.currency !== currency) {
        throw new TransactionOperationError("CURRENCY_MISMATCH");
      }

      const currentBalance = toWalletBalance(walletData);
      const nextBalance = roundMoney(
        currentBalance - getSignedTransactionAmount(type, amount),
      );

      firestoreTransaction.update(walletRef, {
        balance: nextBalance,
        updatedAt: now,
      });
      firestoreTransaction.delete(transactionRef);
    });

    return {
      transaction: {
        id: transactionId,
        type: "expense",
        amount: 0,
        currency: "EUR",
        walletId: "",
        categoryId: "unknown",
        concept: "",
        date: "",
        ownerId,
        createdAt: now,
        updatedAt: now,
      },
      wallets: mappedWallets,
    };
  }
}

function getSignedTransactionAmount(
  type: TransactionType | CreateTransactionDto,
  amount?: number,
): number {
  if (typeof type === "object") {
    return getSignedTransactionAmountObj(type);
  }

  const movementAmount = amount ?? 0;
  return getSignedTransactionAmountObj({
    type: type as "expense" | "income",
    amount: movementAmount,
  });
}

function getSignedTransactionAmountObj({
  type,
  amount,
}: {
  type: "expense" | "income";
  amount: number;
}): number {
  return roundMoney(type === "income" ? amount : -amount);
}
