import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { OutboxMutation } from "@/shared/lib/local-db/local-db.types";

export const mockCreateTransaction = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockUpdateTransaction = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockDeleteTransaction = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockCreateTransfer = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockUpdateTransfer = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockDeleteTransfer = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockDoc = jest.fn<(...args: unknown[]) => unknown>();
export const mockGetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.mock("@/features/transactions/repositories/transaction-create.operation", () => ({
  createTransactionOperation: (...args: unknown[]) => mockCreateTransaction(...args),
}));
jest.mock("@/features/transactions/repositories/transaction-update.operation", () => ({
  updateTransactionOperation: (...args: unknown[]) => mockUpdateTransaction(...args),
}));
jest.mock("@/features/transactions/repositories/transaction-delete.operation", () => ({
  deleteTransactionOperation: (...args: unknown[]) => mockDeleteTransaction(...args),
}));
jest.mock("@/features/transfers/repositories/transfer-create.operation", () => ({
  createTransferOperation: (...args: unknown[]) => mockCreateTransfer(...args),
}));
jest.mock("@/features/transfers/repositories/transfer-update.operation", () => ({
  updateTransferOperation: (...args: unknown[]) => mockUpdateTransfer(...args),
}));
jest.mock("@/features/transfers/repositories/transfer-delete.operation", () => ({
  deleteTransferOperation: (...args: unknown[]) => mockDeleteTransfer(...args),
}));
jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));
jest.mock("@/lib/firebase", () => ({ db: { name: "test-db" } }));

import { SyncMutationError } from "@/shared/services/sync/sync.errors";

import { FirestoreSyncExecutor } from "../firestore-sync-executor";

const NOW = "2026-11-26T10:00:00.000Z";

const transactionSnapshot = {
  id: "tx-1",
  type: "expense",
  amount: 25,
  currency: "EUR",
  walletId: "wallet-1",
  categoryId: "cat-1",
  concept: "Supermercado",
  date: "2026-11-26",
};

function buildMutation(overrides: Partial<OutboxMutation> = {}): OutboxMutation {
  return {
    clientMutationId: "m1",
    ownerId: "owner-1",
    seq: 1,
    entityType: "transaction",
    entityId: "tx-1",
    operation: "create",
    baseRevision: 0,
    localSnapshot: transactionSnapshot,
    serverSnapshot: {},
    dependsOn: [],
    status: "syncing",
    attempts: 0,
    nextAttemptAt: null,
    lastErrorCode: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

const transactionWallets = [
  {
    id: "wallet-1",
    balance: 75,
    revision: 2,
    name: "Cuenta",
    currency: "EUR",
  },
];

function transactionResult(revision = 1) {
  return {
    transaction: { id: "tx-1", revision },
    wallets: transactionWallets,
  };
}

function transferResult(revision = 1) {
  return {
    transfer: { id: "transfer-1", revision },
    wallets: [
      { id: "wallet-1", balance: 90, revision: 3, name: "A" },
      { id: "wallet-2", balance: 10, revision: 3, name: "B" },
    ],
  };
}

const transferSnapshot = {
  id: "transfer-1",
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: 10,
  currency: "EUR",
  date: "2026-11-26",
};

let executor: FirestoreSyncExecutor;

beforeEach(() => {
  jest.clearAllMocks();
  mockDoc.mockReturnValue({ kind: "document" });
  mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ revision: 4 }) });
  executor = new FirestoreSyncExecutor();
});

describe("FirestoreSyncExecutor transactions", () => {
  it("creates through the idempotent operation", async () => {
    mockCreateTransaction.mockResolvedValue(transactionResult(1));

    const outcome = await executor.execute(buildMutation());

    expect(mockCreateTransaction).toHaveBeenCalledWith(
      "owner-1",
      expect.objectContaining({ id: "tx-1", amount: 25 }),
      { clientMutationId: "m1", baseRevision: 0 },
    );
    expect(outcome).toEqual({
      status: "applied",
      revisionAfter: 1,
      wallets: [{ id: "wallet-1", balance: 75, revision: 2 }],
    });
  });

  it("updates and deletes with the same context", async () => {
    mockUpdateTransaction.mockResolvedValue(transactionResult(2));
    mockDeleteTransaction.mockResolvedValue(transactionResult(3));

    await executor.execute(buildMutation({ operation: "update", baseRevision: 1 }));
    await executor.execute(buildMutation({ operation: "delete", baseRevision: 2 }));

    expect(mockUpdateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ transactionId: "tx-1", mutation: { clientMutationId: "m1", baseRevision: 1 } }),
    );
    expect(mockDeleteTransaction).toHaveBeenCalledWith("owner-1", "tx-1", {
      clientMutationId: "m1",
      baseRevision: 2,
    });
  });
});

describe("FirestoreSyncExecutor transfers", () => {
  const transferMutation = buildMutation({
    entityType: "transfer",
    entityId: "transfer-1",
    localSnapshot: transferSnapshot,
  });

  it("creates a transfer", async () => {
    mockCreateTransfer.mockResolvedValue(transferResult(1));

    const outcome = await executor.execute(transferMutation);

    expect(mockCreateTransfer).toHaveBeenCalledWith(
      "owner-1",
      expect.objectContaining({ fromWalletId: "wallet-1" }),
      { clientMutationId: "m1", baseRevision: 0 },
    );
    expect(outcome).toMatchObject({ status: "applied", revisionAfter: 1 });
  });

  it("updates and deletes a transfer", async () => {
    mockUpdateTransfer.mockResolvedValue(transferResult(2));
    mockDeleteTransfer.mockResolvedValue(transferResult(3));

    await executor.execute({ ...transferMutation, operation: "update" });
    await executor.execute({ ...transferMutation, operation: "delete" });

    expect(mockUpdateTransfer).toHaveBeenCalled();
    expect(mockDeleteTransfer).toHaveBeenCalledWith("owner-1", "transfer-1", {
      clientMutationId: "m1",
      baseRevision: 0,
    });
  });
});

describe("FirestoreSyncExecutor outcomes", () => {
  it("rejects an entity the queue cannot push", async () => {
    await expect(
      executor.execute(buildMutation({ entityType: "wallet" })),
    ).resolves.toEqual({
      status: "failed",
      errorCode: "SYNC_UNSUPPORTED_ENTITY",
    });
  });

  it("turns a revision mismatch into a conflict with the remote snapshot", async () => {
    mockUpdateTransaction.mockRejectedValue(new SyncMutationError("REMOTE_CHANGED"));

    const outcome = await executor.execute(
      buildMutation({ operation: "update" }),
    );

    expect(outcome).toMatchObject({
      status: "conflict",
      kind: "REMOTE_CHANGED",
      remoteSnapshot: { revision: 4 },
    });
    expect(mockGetDoc).toHaveBeenCalled();
  });

  it("classifies a connectivity failure as retry without reading the remote", async () => {
    mockCreateTransaction.mockRejectedValue({ code: "unavailable" });

    await expect(executor.execute(buildMutation())).resolves.toEqual({
      status: "retry",
      errorCode: "unavailable",
    });
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it("turns a malformed snapshot into an INVALID conflict", async () => {
    const outcome = await executor.execute(
      buildMutation({ localSnapshot: { id: "tx-1" } }),
    );

    expect(outcome).toMatchObject({ status: "conflict", kind: "INVALID" });
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it("degrades an unreachable remote snapshot to an empty object on a remote delete", async () => {
    mockDeleteTransaction.mockRejectedValue(new SyncMutationError("DELETED_REMOTELY"));
    mockGetDoc.mockRejectedValue(new Error("offline"));

    await expect(
      executor.execute(buildMutation({ operation: "delete" })),
    ).resolves.toMatchObject({ status: "conflict", remoteSnapshot: {} });
  });

  it("retries instead of storing an empty snapshot for a readable conflict", async () => {
    mockUpdateTransaction.mockRejectedValue(new SyncMutationError("REMOTE_CHANGED"));
    mockGetDoc.mockRejectedValue(new Error("offline"));

    await expect(
      executor.execute(buildMutation({ operation: "update" })),
    ).resolves.toEqual({
      status: "retry",
      errorCode: "SYNC_REMOTE_SNAPSHOT_UNAVAILABLE",
    });
  });
});
