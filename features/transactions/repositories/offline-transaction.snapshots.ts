import type { LocalDatabaseTransaction } from "@/shared/lib/local-db/database.port";
import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { roundMoney } from "@/shared/utils/money";
import { INITIAL_REVISION, readStoredRevision } from "@/shared/utils/revision";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";

import type {
  CreateTransactionDto,
  Transaction,
  UpdateTransactionDto,
} from "../types/transaction.types";
import { toTransactionLocalRow } from "./local-transaction.mapper";
import { readTransactionLinkIds } from "./transaction-link-readers";

const TRANSACTIONS = "transactions" as const;

/** Firestore-shaped document of a local row (everything except `syncStatus`). */
export function toTransactionSnapshot(
  row: LocalRow,
): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (key === "syncStatus") continue;
    snapshot[key] = value;
  }

  return snapshot;
}

/** New pending movement built from a create DTO. */
export function buildCreatedTransactionRow(
  ownerId: string,
  id: string,
  dto: CreateTransactionDto,
  now: string,
): LocalRow {
  const notes = dto.notes?.trim();
  const transaction: Transaction = {
    id,
    type: dto.type,
    amount: roundMoney(dto.amount),
    currency: dto.currency,
    walletId: dto.walletId,
    categoryId: dto.categoryId,
    concept: dto.concept.trim(),
    date: dto.date,
    ownerId,
    revision: INITIAL_REVISION,
    ...(notes ? { notes } : {}),
    ...readTransactionLinkIds(dto),
    createdAt: now,
    updatedAt: now,
    deletedAt: dto.deletedAt ?? null,
  };

  return toTransactionLocalRow(transaction, "pending");
}

/**
 * Updated pending movement: keeps `createdAt`, `revision` and every stored
 * link id, because only the owning feature may remove a link.
 */
export function buildUpdatedTransactionRow(
  existing: Transaction,
  dto: UpdateTransactionDto,
  now: string,
): LocalRow {
  const keepWalletName =
    isOrphanedWalletId(existing.walletId) &&
    isOrphanedWalletId(dto.walletId);
  const notes = dto.notes?.trim();

  return toTransactionLocalRow(
    {
      ...existing,
      type: dto.type,
      amount: roundMoney(dto.amount),
      currency: dto.currency,
      walletId: dto.walletId,
      walletName: keepWalletName ? existing.walletName : undefined,
      categoryId: dto.categoryId,
      concept: dto.concept.trim(),
      date: dto.date,
      ...(notes ? { notes } : {}),
      updatedAt: now,
      deletedAt: null,
    },
    "pending",
  );
}

/** Soft-deleted row; the revision stays at the value the server knows. */
export function markTransactionRowDeleted(
  existing: Transaction,
  now: string,
): LocalRow {
  return toTransactionLocalRow(
    { ...existing, deletedAt: now, updatedAt: now },
    "pending",
  );
}

/** Server revision and snapshot the outbox must keep for conflict detection. */
export function resolveOutboxServerState(
  row: LocalRow,
  mutation: { baseRevision: number; serverSnapshot: Record<string, unknown> } | null,
): { baseRevision: number; serverSnapshot: Record<string, unknown> } {
  if (mutation) {
    return {
      baseRevision: mutation.baseRevision,
      serverSnapshot: mutation.serverSnapshot,
    };
  }

  return {
    baseRevision: readStoredRevision(row),
    serverSnapshot: toTransactionSnapshot(row),
  };
}

/** Local row of one movement, owner-scoped. */
export async function readTransactionRow(
  active: LocalDatabaseTransaction,
  ownerId: string,
  transactionId: string,
): Promise<LocalRow | null> {
  const rows = await active.select<LocalRow>(TRANSACTIONS, {
    where: { id: transactionId, ownerId },
    limit: 1,
  });

  return rows[0] ?? null;
}

/**
 * Local row by primary key only. Ids are global in the local table, so a
 * create must never overwrite a row that belongs to another account.
 */
export async function readTransactionRowById(
  active: LocalDatabaseTransaction,
  transactionId: string,
): Promise<LocalRow | null> {
  const rows = await active.select<LocalRow>(TRANSACTIONS, {
    where: { id: transactionId },
    limit: 1,
  });

  return rows[0] ?? null;
}
