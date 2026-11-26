import { jest } from "@jest/globals";

import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";

import { OfflineTransactionRepository } from "../offline-transaction.repository";
import type { ITransactionRepository } from "../transaction.repository";
import { toWalletLocalRow } from "@/features/wallets/repositories/local-wallet.mapper";
import { buildWallet } from "@/features/wallets/repositories/__tests__/local-wallet.fixtures";

export const OFFLINE_OWNER = "owner-1";
export const OFFLINE_NOW = "2026-11-20T10:00:00.000Z";

export function createRemote(): jest.Mocked<ITransactionRepository> {
  return {
    getTransactions: jest.fn(),
    createTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
  };
}

export async function seedWallet(
  db: InMemoryDatabase,
  overrides: Parameters<typeof buildWallet>[0] = {},
): Promise<LocalRow> {
  const row = toWalletLocalRow(
    buildWallet({ ownerId: OFFLINE_OWNER, ...overrides }),
  );
  await db.upsert("wallets", row);

  return row;
}

export function createRepository(
  db: InMemoryDatabase,
  remote: ITransactionRepository,
  overrides: {
    getPort?: () => Promise<InMemoryDatabase | null>;
    now?: () => string;
    createId?: () => string;
  } = {},
): OfflineTransactionRepository {
  let counter = 0;

  return new OfflineTransactionRepository(remote, {
    getPort: async () => db,
    now: () => OFFLINE_NOW,
    createId: () => `id-${++counter}`,
    ...overrides,
  });
}

export async function listOutbox(
  db: InMemoryDatabase,
): Promise<Awaited<ReturnType<LocalOutboxRepository["listByOwner"]>>> {
  return new LocalOutboxRepository(db).listByOwner(OFFLINE_OWNER);
}

export async function findOutboxMutation(
  db: InMemoryDatabase,
  entityId: string,
) {
  return new LocalOutboxRepository(db).find(
    OFFLINE_OWNER,
    "transaction",
    entityId,
  );
}

export async function readTransactionRows(
  db: InMemoryDatabase,
  id?: string,
): Promise<LocalRow[]> {
  return db.select<LocalRow>(
    "transactions",
    id ? { where: { id } } : undefined,
  );
}
