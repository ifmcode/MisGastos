import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the repository.
import {
  setupTransferRepositoryMocks,
  snapshot,
  transactionGet,
  transactionUpdate,
  transferDocument,
  walletDocument,
} from "./transfer-repository.test-helpers";
import { FirebaseTransferRepository } from "../firebase-transfer.repository";

beforeEach(setupTransferRepositoryMocks);

describe("FirebaseTransferRepository.deleteTransfer errors", () => {
  it("rejects foreign, invalid or already deleted transfers", async () => {
    const repository = new FirebaseTransferRepository();

    transactionGet.mockResolvedValueOnce(
      snapshot("transfer-1", transferDocument({ ownerId: "user-2" })),
    );
    await expect(
      repository.deleteTransfer("user-1", "transfer-1"),
    ).rejects.toMatchObject({ code: "TRANSFER_NOT_FOUND" });

    transactionGet.mockResolvedValueOnce(
      snapshot("transfer-1", { ownerId: "user-1" }),
    );
    await expect(
      repository.deleteTransfer("user-1", "transfer-1"),
    ).rejects.toMatchObject({ code: "TRANSFER_INVALID" });

    transactionGet.mockResolvedValueOnce(
      snapshot("transfer-1", transferDocument({ deletedAt: "2026-11-01" })),
    );
    await expect(
      repository.deleteTransfer("user-1", "transfer-1"),
    ).rejects.toMatchObject({ code: "TRANSFER_NOT_FOUND" });
  });

  it("rejects wallet ownership and missing destination errors", async () => {
    const repository = new FirebaseTransferRepository();

    transactionGet
      .mockResolvedValueOnce(snapshot("transfer-1", transferDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ ownerId: "user-2" })),
      );
    await expect(
      repository.deleteTransfer("user-1", "transfer-1"),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });

    transactionGet
      .mockResolvedValueOnce(snapshot("transfer-1", transferDocument()))
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument()))
      .mockResolvedValueOnce(snapshot("wallet-2"));
    await expect(
      repository.deleteTransfer("user-1", "transfer-1"),
    ).rejects.toMatchObject({ code: "TO_WALLET_NOT_FOUND" });
  });

  it("only updates the transfer when both sides are orphaned", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(
        "transfer-1",
        transferDocument({ fromWalletId: "-1", toWalletId: "-1" }),
      ),
    );

    const repository = new FirebaseTransferRepository();
    const result = await repository.deleteTransfer("user-1", "transfer-1");

    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "transfer", id: "transfer-1" },
      expect.objectContaining({ deletedAt: expect.any(String) }),
    );
    expect(result.wallets).toEqual([]);
  });
});
