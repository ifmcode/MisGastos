import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  mockDoc,
  setupTransferRepositoryMocks,
  snapshot,
  transactionGet,
  transactionSet,
  transferDocument,
  validDto,
  walletDocument,
} from "./transfer-repository.test-helpers";
import { createTransferOperation } from "../transfer-create.operation";
import { deleteTransferOperation } from "../transfer-delete.operation";
import { updateTransferOperation } from "../transfer-update.operation";

const context = { clientMutationId: "m1", baseRevision: 0 };
const markerRef = { kind: "marker", id: "user-1__m1" };
const transferRef = { kind: "transfer", id: "transfer-1" };

beforeEach(() => {
  setupTransferRepositoryMocks();
  mockDoc.mockImplementation((...args: unknown[]) => {
    if (args[1] === "appliedMutations") return markerRef;
    if (args[1] === "transfers") return transferRef;
    if (args.length === 1) return transferRef;
    return { kind: "wallet", id: args[2] };
  });
});

describe("sync mutation — transfer create", () => {
  it("writes the marker with the wallets and the transfer", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", undefined))
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument()))
      .mockResolvedValueOnce(snapshot("wallet-2", walletDocument()));

    await createTransferOperation("user-1", { ...validDto, id: "transfer-1" }, context);

    expect(transactionSet).toHaveBeenCalledWith(
      transferRef,
      expect.objectContaining({ ownerId: "user-1" }),
    );
    expect(transactionSet).toHaveBeenCalledWith(markerRef, {
      ownerId: "user-1",
      clientMutationId: "m1",
      entityType: "transfer",
      entityId: "transfer-1",
      revisionAfter: 0,
      appliedAt: expect.any(String),
    });
  });

  it("replays without applying the balances again", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", { revisionAfter: 0 }))
      .mockResolvedValueOnce(snapshot("transfer-1", transferDocument()))
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument()))
      .mockResolvedValueOnce(snapshot("wallet-2", walletDocument()));

    const result = await createTransferOperation("user-1", validDto, context);

    expect(transactionSet).not.toHaveBeenCalled();
    expect(result.transfer.id).toBe("transfer-1");
    expect(result.wallets).toHaveLength(2);
  });
});

describe("sync mutation — transfer update", () => {
  it("bumps the revision in the marker", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", undefined))
      .mockResolvedValueOnce(snapshot("transfer-1", transferDocument({ revision: 0 })))
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument()))
      .mockResolvedValueOnce(snapshot("wallet-2", walletDocument()));

    await updateTransferOperation({
      ownerId: "user-1",
      transferId: "transfer-1",
      dto: validDto,
      mutation: context,
    });

    expect(transactionSet).toHaveBeenCalledWith(
      markerRef,
      expect.objectContaining({ revisionAfter: 1 }),
    );
  });

  it("stops with REMOTE_CHANGED when the revision moved", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", undefined))
      .mockResolvedValueOnce(snapshot("transfer-1", transferDocument({ revision: 4 })));

    await expect(
      updateTransferOperation({
        ownerId: "user-1",
        transferId: "transfer-1",
        dto: validDto,
        mutation: context,
      }),
    ).rejects.toMatchObject({ kind: "REMOTE_CHANGED" });
  });
});

describe("sync mutation — transfer delete", () => {
  it("succeeds when another device deleted it first", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("marker", undefined))
      .mockResolvedValueOnce(
        snapshot(
          "transfer-1",
          transferDocument({ deletedAt: "2026-11-26T10:00:00.000Z" }),
        ),
      );

    const result = await deleteTransferOperation(
      "user-1",
      "transfer-1",
      context,
    );

    expect(result.transfer.deletedAt).toBe("2026-11-26T10:00:00.000Z");
    expect(result.wallets).toEqual([]);
  });
});
