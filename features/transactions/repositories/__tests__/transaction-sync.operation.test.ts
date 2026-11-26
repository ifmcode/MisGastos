import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  mockDoc,
  mockGetDoc,
  setupTransactionRepositoryMocks,
  snapshot,
  transactionDocument,
  transactionGet,
  transactionSet,
  transactionUpdate,
  validDto,
  walletDocument,
  walletRef,
} from "./transaction-repository.test-helpers";
import { createTransactionOperation } from "../transaction-create.operation";
import { deleteTransactionOperation } from "../transaction-delete.operation";
import { updateTransactionOperation } from "../transaction-update.operation";

const context = { clientMutationId: "m1", baseRevision: 0 };
const markerRef = { kind: "marker", id: "user-1__m1" };

beforeEach(() => {
  setupTransactionRepositoryMocks();
  mockDoc.mockImplementation((...args: unknown[]) => {
    if (args[1] === "appliedMutations") return markerRef;
    if (args[1] === "wallets") return { kind: "wallet", id: args[2] };
    if (args.length === 1) return { kind: "transaction", id: "transaction-1" };
    return { kind: "transaction", id: args[2] };
  });
  mockGetDoc.mockResolvedValue(
    snapshot("wallet-1", walletDocument({ balance: 74.5 })),
  );
});

describe("sync mutation — transaction create", () => {
  it("writes the marker atomically with the movement", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", undefined))
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument()));

    const result = await createTransactionOperation(
      "user-1",
      { ...validDto, id: "tx-1" },
      context,
    );

    expect(transactionSet).toHaveBeenCalledWith(
      { kind: "transaction", id: "tx-1" },
      expect.objectContaining({ ownerId: "user-1" }),
    );
    expect(transactionSet).toHaveBeenCalledWith(markerRef, {
      ownerId: "user-1",
      clientMutationId: "m1",
      entityType: "transaction",
      entityId: "tx-1",
      revisionAfter: 0,
      appliedAt: expect.any(String),
    });
    expect(result.transaction.id).toBe("tx-1");
  });

  it("returns the stored movement without applying twice on replay", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", { revisionAfter: 0 }))
      .mockResolvedValueOnce(
        snapshot("tx-1", transactionDocument({ id: "tx-1" })),
      )
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument({ balance: 74.5 })));

    const result = await createTransactionOperation(
      "user-1",
      { ...validDto, id: "tx-1" },
      context,
    );

    expect(transactionSet).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(result.transaction.id).toBe("tx-1");
    expect(result.wallets).toEqual([
      expect.objectContaining({ id: "wallet-1", balance: 74.5 }),
    ]);
  });
});

describe("sync mutation — transaction update", () => {
  it("checks the base revision and bumps it in the marker", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", undefined))
      .mockResolvedValueOnce(
        snapshot("transaction-1", transactionDocument({ revision: 0 })),
      )
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument()));

    await updateTransactionOperation({
      ownerId: "user-1",
      transactionId: "transaction-1",
      dto: { ...validDto, amount: 30 },
      mutation: context,
    });

    expect(transactionSet).toHaveBeenCalledWith(
      markerRef,
      expect.objectContaining({
        entityId: "transaction-1",
        revisionAfter: 1,
      }),
    );
  });

  it("stops with REMOTE_CHANGED when another device edited it", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", undefined))
      .mockResolvedValueOnce(
        snapshot("transaction-1", transactionDocument({ revision: 3 })),
      );

    await expect(
      updateTransactionOperation({
        ownerId: "user-1",
        transactionId: "transaction-1",
        dto: validDto,
        mutation: context,
      }),
    ).rejects.toMatchObject({ kind: "REMOTE_CHANGED" });
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("replays without touching the wallet or the marker", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", { revisionAfter: 3 }))
      .mockResolvedValueOnce(
        snapshot(
          "transaction-1",
          transactionDocument({ id: "transaction-1", revision: 3 }),
        ),
      )
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument({ balance: 74.5 })));

    const result = await updateTransactionOperation({
      ownerId: "user-1",
      transactionId: "transaction-1",
      dto: validDto,
      mutation: context,
    });

    expect(result.transaction.revision).toBe(3);
    expect(result.wallets).toEqual([
      expect.objectContaining({ id: "wallet-1" }),
    ]);
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(transactionSet).not.toHaveBeenCalled();
  });
});

describe("sync mutation — transaction delete", () => {
  it("reverts once and writes the new revision in the marker", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", undefined))
      .mockResolvedValueOnce(
        snapshot("transaction-1", transactionDocument({ revision: 0 })),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 74.5 })),
      );

    await deleteTransactionOperation("user-1", "transaction-1", context);

    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "wallet", id: "wallet-1" },
      expect.objectContaining({ balance: 100 }),
    );
    expect(transactionSet).toHaveBeenCalledWith(
      markerRef,
      expect.objectContaining({ revisionAfter: 1 }),
    );
  });

  it("succeeds when another device deleted it first", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", undefined))
      .mockResolvedValueOnce(
        snapshot(
          "transaction-1",
          transactionDocument({ deletedAt: "2026-11-26T10:00:00.000Z" }),
        ),
      );

    const result = await deleteTransactionOperation(
      "user-1",
      "transaction-1",
      context,
    );

    expect(result.transaction.deletedAt).toBe("2026-11-26T10:00:00.000Z");
    expect(result.wallets).toEqual([]);
    expect(transactionSet).not.toHaveBeenCalled();
  });

  it("stops with REMOTE_CHANGED when the revision moved", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", undefined))
      .mockResolvedValueOnce(
        snapshot("transaction-1", transactionDocument({ revision: 9 })),
      );

    await expect(
      deleteTransactionOperation("user-1", "transaction-1", context),
    ).rejects.toMatchObject({ kind: "REMOTE_CHANGED" });
  });
});
