import type { LocalDatabaseTransaction } from "@/shared/lib/local-db/database.port";
import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";

import { TransactionOperationError } from "../services/transaction.errors";
import type { Transaction } from "../types/transaction.types";

const WALLETS = "wallets" as const;

/** Validates the target wallet the same way the online operation does. */
export async function validateTransactionWallet(
  active: LocalDatabaseTransaction,
  ownerId: string,
  walletId: string,
  currency: string,
): Promise<LocalRow> {
  const rows = await active.select<LocalRow>(WALLETS, {
    where: { id: walletId },
    limit: 1,
  });
  const wallet = rows[0];

  if (!wallet) {
    throw new TransactionOperationError("WALLET_NOT_FOUND");
  }
  if (wallet.ownerId !== ownerId) {
    throw new TransactionOperationError("WALLET_NOT_OWNED");
  }
  if (wallet.currency !== currency) {
    throw new TransactionOperationError("CURRENCY_MISMATCH");
  }

  return wallet;
}

/** Editing across wallets still needs the original wallet to be reachable. */
export async function assertPreviousTransactionWallet(
  active: LocalDatabaseTransaction,
  ownerId: string,
  previousWalletId: string,
  nextWalletId: string,
): Promise<void> {
  if (previousWalletId === nextWalletId) return;
  if (isOrphanedWalletId(previousWalletId)) return;

  const rows = await active.select<LocalRow>(WALLETS, {
    where: { id: previousWalletId },
    limit: 1,
  });
  const wallet = rows[0];

  if (!wallet) {
    throw new TransactionOperationError("WALLET_NOT_FOUND");
  }
  if (wallet.ownerId !== ownerId) {
    throw new TransactionOperationError("WALLET_NOT_OWNED");
  }
}

/** Local row as the domain entity, rejecting a malformed stored record. */
export function requireMappedTransaction(
  transaction: Transaction | null,
): Transaction {
  if (!transaction) {
    throw new TransactionOperationError("TRANSACTION_INVALID");
  }

  return transaction;
}
