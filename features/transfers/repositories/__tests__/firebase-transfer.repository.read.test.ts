import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the repository.
import {
  mockCollection,
  mockDoc,
  mockGetDoc,
  mockGetDocs,
  mockQuery,
  mockWhere,
  setupTransferRepositoryMocks,
  snapshot,
  transferDocument,
} from "./transfer-repository.test-helpers";
import { FirebaseTransferRepository } from "../firebase-transfer.repository";

beforeEach(setupTransferRepositoryMocks);

describe("FirebaseTransferRepository.getTransfers", () => {
  it("queries the user's transfers and sorts them newest first", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "transfer-older",
          data: () => ({
            fromWalletId: "wallet-1",
            toWalletId: "wallet-2",
            amount: 10,
            currency: "EUR",
            date: "2026-10-27",
            ownerId: "user-1",
            createdAt: "2026-10-27T10:00:00.000Z",
            updatedAt: "2026-10-27T10:00:00.000Z",
          }),
        },
        {
          id: "transfer-deleted",
          data: () => ({
            ...transferDocument({ date: "2026-10-30" }),
            deletedAt: "2026-10-30T10:00:00.000Z",
          }),
        },
        {
          id: "broken",
          data: () => ({ fromWalletId: "wallet-1" }),
        },
        {
          id: "transfer-newer",
          data: () => ({
            fromWalletId: "wallet-2",
            toWalletId: "wallet-1",
            amount: 20,
            currency: "EUR",
            date: "2026-10-29",
            ownerId: "user-1",
            createdAt: "2026-10-29T10:00:00.000Z",
            updatedAt: "2026-10-29T10:00:00.000Z",
          }),
        },
      ],
    });

    const repository = new FirebaseTransferRepository();
    const transfers = await repository.getTransfers("user-1");

    expect(mockCollection).toHaveBeenCalledWith({ name: "test-db" }, "transfers");
    expect(mockWhere).toHaveBeenCalledWith("ownerId", "==", "user-1");
    expect(mockQuery).toHaveBeenCalledWith(
      { path: "transfers-collection" },
      { field: "ownerId" },
    );
    expect(mockGetDocs).toHaveBeenCalledWith({ path: "transfers-query" });
    expect(transfers.map((transfer) => transfer.id)).toEqual([
      "transfer-newer",
      "transfer-older",
    ]);
  });

  it("propagates Firestore failures", async () => {
    const failure = new Error("permission-denied");
    mockGetDocs.mockRejectedValue(failure);

    const repository = new FirebaseTransferRepository();

    await expect(repository.getTransfers("user-1")).rejects.toBe(failure);
  });
});

describe("FirebaseTransferRepository.getTransfer", () => {
  it("returns an active transfer owned by the user", async () => {
    mockGetDoc.mockResolvedValue(snapshot("transfer-1", transferDocument()));

    const repository = new FirebaseTransferRepository();
    const transfer = await repository.getTransfer("user-1", "transfer-1");

    expect(mockDoc).toHaveBeenCalledWith(
      { name: "test-db" },
      "transfers",
      "transfer-1",
    );
    expect(mockGetDoc).toHaveBeenCalled();
    expect(transfer).toMatchObject({
      id: "transfer-1",
      ownerId: "user-1",
      amount: 25.5,
    });
  });

  it("returns null for missing, foreign or deleted transfers", async () => {
    const repository = new FirebaseTransferRepository();

    mockGetDoc.mockResolvedValueOnce(snapshot("transfer-1"));
    await expect(
      repository.getTransfer("user-1", "transfer-1"),
    ).resolves.toBeNull();

    mockGetDoc.mockResolvedValueOnce(
      snapshot("transfer-1", transferDocument({ ownerId: "user-2" })),
    );
    await expect(
      repository.getTransfer("user-1", "transfer-1"),
    ).resolves.toBeNull();

    mockGetDoc.mockResolvedValueOnce(
      snapshot(
        "transfer-1",
        transferDocument({
          deletedAt: "2026-10-30T10:00:00.000Z",
        }),
      ),
    );
    await expect(
      repository.getTransfer("user-1", "transfer-1"),
    ).resolves.toBeNull();
  });
});
