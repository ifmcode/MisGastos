import { FirebaseTransactionRepository } from "@/features/transactions/repositories/firebase-transaction.repository";
import { cacheTransactions } from "@/features/transactions/repositories/local-transaction.cache";
import { FirebaseTransferRepository } from "@/features/transfers/repositories/firebase-transfer.repository";
import { cacheTransfers } from "@/features/transfers/repositories/local-transfer.cache";
import { FirebaseWalletRepository } from "@/features/wallets/repositories/firebase-wallet.repository";
import { cacheWallets } from "@/features/wallets/repositories/local-wallet.cache";

import { pullSocialData } from "./sync-social-pull";

/**
 * Owner-scoped full pull (ADR §5.4): re-read the personal collections and
 * mirror them into SQLite. It runs after the push cycle, so the freshly applied
 * mutations come back as server state and `serverBalance` is refreshed.
 * Listeners (`onSnapshot`) are a later phase; the provider triggers this on
 * start, reconnect, foreground and manual retry.
 */
export async function pullOwnerData(ownerId: string): Promise<void> {
  const now = new Date().toISOString();
  const [wallets, transactions, transfers] = await Promise.all([
    new FirebaseWalletRepository().getWallets(ownerId),
    new FirebaseTransactionRepository().getTransactions(ownerId),
    new FirebaseTransferRepository().getTransfers(ownerId),
  ]);

  await cacheWallets(ownerId, wallets, now);
  await cacheTransactions(ownerId, transactions, now);
  await cacheTransfers(ownerId, transfers, now);
  await pullSocialData(ownerId);
}
