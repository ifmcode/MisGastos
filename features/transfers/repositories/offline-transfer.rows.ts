import type { LocalDatabaseTransaction } from "@/shared/lib/local-db/database.port";
import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { roundMoney } from "@/shared/utils/money";
import { INITIAL_REVISION, readStoredRevision } from "@/shared/utils/revision";

import { TransferOperationError } from "../services/transfer.errors";
import type {
  CreateTransferDto,
  Transfer,
  UpdateTransferDto,
} from "../types/transfer.types";
import { toTransferLocalRow } from "./local-transfer.mapper";

const TRANSFERS = "transfers" as const;

/** Firestore-shaped document of a local row (everything except `syncStatus`). */
export function toTransferSnapshot(row: LocalRow): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (key === "syncStatus") continue;
    snapshot[key] = value;
  }

  return snapshot;
}

/** New pending transfer built from a create DTO. */
export function buildCreatedTransferRow(
  ownerId: string,
  id: string,
  dto: CreateTransferDto,
  now: string,
): LocalRow {
  const notes = dto.notes?.trim();
  const transfer: Transfer = {
    id,
    fromWalletId: dto.fromWalletId,
    toWalletId: dto.toWalletId,
    amount: roundMoney(dto.amount),
    currency: dto.currency,
    date: dto.date,
    ownerId,
    revision: INITIAL_REVISION,
    ...(notes ? { notes } : {}),
    createdAt: now,
    updatedAt: now,
  };

  return toTransferLocalRow(transfer, "pending");
}

/** Updated pending transfer: keeps `createdAt` and the server revision. */
export function buildUpdatedTransferRow(
  existing: Transfer,
  dto: UpdateTransferDto,
  now: string,
): LocalRow {
  const notes = dto.notes?.trim();

  return toTransferLocalRow(
    {
      ...existing,
      fromWalletId: dto.fromWalletId,
      toWalletId: dto.toWalletId,
      fromWalletName: undefined,
      toWalletName: undefined,
      amount: roundMoney(dto.amount),
      currency: dto.currency,
      date: dto.date,
      ...(notes ? { notes } : {}),
      updatedAt: now,
      deletedAt: undefined,
    },
    "pending",
  );
}

/** Soft-deleted row; the revision stays at the value the server knows. */
export function markTransferRowDeleted(
  existing: Transfer,
  now: string,
): LocalRow {
  return toTransferLocalRow(
    { ...existing, deletedAt: now, updatedAt: now },
    "pending",
  );
}

/** Server revision and snapshot the outbox must keep for conflict detection. */
export function resolveTransferOutboxServerState(
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
    serverSnapshot: toTransferSnapshot(row),
  };
}

/** Local row of one transfer, owner-scoped. */
export async function readTransferRow(
  active: LocalDatabaseTransaction,
  ownerId: string,
  transferId: string,
): Promise<LocalRow | null> {
  const rows = await active.select<LocalRow>(TRANSFERS, {
    where: { id: transferId, ownerId },
    limit: 1,
  });

  return rows[0] ?? null;
}

/**
 * Local row by primary key only. Ids are global in the local table, so a
 * create must never overwrite a row that belongs to another account.
 */
export async function readTransferRowById(
  active: LocalDatabaseTransaction,
  transferId: string,
): Promise<LocalRow | null> {
  const rows = await active.select<LocalRow>(TRANSFERS, {
    where: { id: transferId },
    limit: 1,
  });

  return rows[0] ?? null;
}

/** Local row as the domain entity, rejecting a malformed stored record. */
export function requireMappedTransfer(transfer: Transfer | null): Transfer {
  if (!transfer) {
    throw new TransferOperationError("TRANSFER_INVALID");
  }

  return transfer;
}
