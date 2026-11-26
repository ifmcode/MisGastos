import type {
  DatabasePort,
  LocalDatabaseTransaction,
} from "@/shared/lib/local-db/database.port";
import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import { readOutboxWalletDeltas } from "@/shared/lib/local-db/pending-balance";
import { roundMoney } from "@/shared/utils/money";

import { Wallet } from "../types/wallet.types";
import { fromWalletLocalRow } from "./local-wallet.mapper";

/** Pending wallet deltas derived from the owner's outbox. */
export async function readPendingWalletDeltas(
  port: DatabasePort,
  ownerId: string,
  tx?: LocalDatabaseTransaction,
): Promise<Map<string, number>> {
  const mutations = await new LocalOutboxRepository(port).listByOwner(
    ownerId,
    tx,
  );

  return readOutboxWalletDeltas(mutations);
}

/**
 * Returns the wallets with `serverBalance + pending delta`. It never mutates
 * the stored wallet rows: the delta is recomputed on every read.
 */
export function applyPendingWalletDeltas(
  wallets: readonly Wallet[],
  deltas: ReadonlyMap<string, number>,
): Wallet[] {
  return wallets.map((wallet) => {
    const delta = deltas.get(wallet.id);
    if (!delta) return wallet;

    return { ...wallet, balance: roundMoney(wallet.balance + delta) };
  });
}

async function readWalletRows(
  port: DatabasePort,
  ownerId: string,
  walletIds: readonly string[] | undefined,
  tx?: LocalDatabaseTransaction,
): Promise<LocalRow[]> {
  const active = tx ?? port;

  if (!walletIds) {
    return active.select<LocalRow>("wallets", {
      where: { ownerId },
      orderBy: [{ column: "createdAt", direction: "desc" }],
    });
  }

  const wanted = new Set(walletIds);
  const rows = await active.select<LocalRow>("wallets", {
    where: { ownerId },
    orderBy: [{ column: "createdAt", direction: "desc" }],
  });

  return rows.filter((row) => typeof row.id === "string" && wanted.has(row.id));
}

/**
 * Reads wallets from a known port and applies the pending outbox delta.
 * `walletIds` narrows the result to the wallets touched by a local write.
 */
export async function readWalletsWithPendingBalance(
  port: DatabasePort,
  ownerId: string,
  walletIds?: readonly string[],
  tx?: LocalDatabaseTransaction,
): Promise<Wallet[]> {
  const rows = await readWalletRows(port, ownerId, walletIds, tx);
  const wallets = rows.flatMap((row) => {
    const wallet = fromWalletLocalRow(row);
    return wallet ? [wallet] : [];
  });
  const deltas = await readPendingWalletDeltas(port, ownerId, tx);

  return applyPendingWalletDeltas(wallets, deltas);
}

/** Runtime variant: null when there is no local database or the read fails. */
export async function readLocalWalletsWithPendingBalance(
  ownerId: string,
  tx?: LocalDatabaseTransaction,
): Promise<Wallet[] | null> {
  try {
    const port = await getLocalDatabase();
    if (!port) return null;

    return await readWalletsWithPendingBalance(port, ownerId, undefined, tx);
  } catch {
    return null;
  }
}
