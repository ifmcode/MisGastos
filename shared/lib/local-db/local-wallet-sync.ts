import type { LocalDatabaseTransaction } from "./database.port";
import { roundMoney } from "@/shared/utils/money";

export type RemoteWalletUpdate = {
  id: string;
  balance: number;
  revision: number;
  updatedAt?: string;
};

/**
 * Stores the server balance a successful push returned. The outbox row is
 * removed in the same transaction, so the derived balance must switch from
 * `serverBalance + delta` to the new `serverBalance` atomically.
 */
export async function applyRemoteWalletBalances(
  tx: LocalDatabaseTransaction,
  ownerId: string,
  wallets: readonly RemoteWalletUpdate[],
  now: string,
): Promise<void> {
  for (const wallet of wallets) {
    if (typeof wallet.balance !== "number") continue;

    await tx.update(
      "wallets",
      { id: wallet.id, ownerId },
      {
        serverBalance: roundMoney(wallet.balance),
        revision: wallet.revision,
        updatedAt: wallet.updatedAt ?? now,
      },
    );
  }
}
