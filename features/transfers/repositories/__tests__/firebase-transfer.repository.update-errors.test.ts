import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the repository.
import {
  setupTransferRepositoryMocks,
  snapshot,
  transactionGet,
  transactionUpdate,
  transferDocument,
  validDto,
  walletDocument,
} from "./transfer-repository.test-helpers";
import { FirebaseTransferRepository } from "../firebase-transfer.repository";

beforeEach(setupTransferRepositoryMocks);

describe("FirebaseTransferRepository.updateTransfer errors", () => {
  it("rejects invalid updates before reading the transfer", async () => {
    const repository = new FirebaseTransferRepository();

    await expect(
      repository.updateTransfer("user-1", "transfer-1", {
        ...validDto,
        toWalletId: "wallet-1",
      }),
    ).rejects.toMatchObject({ code: "SAME_WALLET" });

    await expect(
      repository.updateTransfer("user-1", "transfer-1", {
        ...validDto,
        amount: 0,
      }),
    ).rejects.toMatchObject({ code: "TRANSFER_INVALID" });

    expect(transactionGet).not.toHaveBeenCalled();
  });

  it("rejects foreign, invalid or deleted transfers", async () => {
    const repository = new FirebaseTransferRepository();

    transactionGet.mockResolvedValueOnce(
      snapshot("transfer-1", transferDocument({ ownerId: "user-2" })),
    );
    await expect(
      repository.updateTransfer("user-1", "transfer-1", validDto),
    ).rejects.toMatchObject({ code: "TRANSFER_NOT_FOUND" });

    transactionGet.mockResolvedValueOnce(
      snapshot("transfer-1", { ownerId: "user-1" }),
    );
    await expect(
      repository.updateTransfer("user-1", "transfer-1", validDto),
    ).rejects.toMatchObject({ code: "TRANSFER_INVALID" });

    transactionGet.mockResolvedValueOnce(
      snapshot("transfer-1", transferDocument({ deletedAt: "2026-11-01" })),
    );
    await expect(
      repository.updateTransfer("user-1", "transfer-1", validDto),
    ).rejects.toMatchObject({ code: "TRANSFER_NOT_FOUND" });
  });

  it("falls back to now when the stored createdAt is invalid", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot("transfer-1", transferDocument({ createdAt: "bad" })),
      )
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument()))
      .mockResolvedValueOnce(snapshot("wallet-2", walletDocument()));

    const repository = new FirebaseTransferRepository();
    await repository.updateTransfer("user-1", "transfer-1", {
      ...validDto,
      amount: 10,
    });

    const patch = transactionUpdate.mock.calls.find(
      (call) => (call[0] as { kind?: string }).kind === "transfer",
    )?.[1] as Record<string, unknown>;

    expect(patch.createdAt).toEqual(expect.any(String));
    expect(patch.createdAt).not.toBe("bad");
  });
});
