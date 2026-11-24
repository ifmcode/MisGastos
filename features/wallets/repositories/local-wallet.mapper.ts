import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import {
  readLocalRowId,
  readLocalRowOwnerId,
} from "@/shared/lib/local-db/local-row.readers";
import { toIsoTimestamp } from "@/shared/utils/date";

import { Wallet } from "../types/wallet.types";
import { mapWalletDocument } from "./wallet.mapper";

const EPOCH_ISO = new Date(0).toISOString();

/**
 * Cache mapping for wallets. `toWalletLocalRow` writes the SQLite row and keeps
 * the displayed balance in `serverBalance` until phase 4 adds a pending delta.
 * `fromWalletLocalRow` rebuilds the Firestore-shaped document and delegates to
 * `mapWalletDocument`, so validation and defaults have a single implementation.
 */
export function toWalletLocalRow(wallet: Wallet): LocalRow {
  return {
    id: wallet.id,
    ownerId: wallet.ownerId,
    name: wallet.name,
    currency: wallet.currency,
    type: wallet.type,
    icon: wallet.icon,
    color: wallet.color,
    initialBalance: wallet.initialBalance,
    serverBalance: wallet.balance,
    includeInTotal: wallet.includeInTotal ? 1 : 0,
    description: wallet.description ?? null,
    archivedAt: wallet.archivedAt ?? null,
    createdAt: toIsoTimestamp(wallet.createdAt) ?? EPOCH_ISO,
    updatedAt: toIsoTimestamp(wallet.updatedAt) ?? EPOCH_ISO,
    deletedAt: null,
    revision: wallet.revision,
    syncStatus: "synced",
  };
}

export function fromWalletLocalRow(row: LocalRow): Wallet | null {
  const id = readLocalRowId(row);
  if (!id) return null;

  return mapWalletDocument(
    id,
    {
      ownerId: row.ownerId,
      name: row.name,
      currency: row.currency,
      type: row.type,
      icon: row.icon,
      color: row.color,
      initialBalance: row.initialBalance,
      balance: row.serverBalance,
      includeInTotal:
        typeof row.includeInTotal === "number"
          ? row.includeInTotal === 1
          : undefined,
      description: row.description,
      archivedAt: row.archivedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      revision: row.revision,
    },
    readLocalRowOwnerId(row),
  );
}
