import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the repository.
import {
  fromWalletRef,
  setupTransferRepositoryMocks,
  snapshot,
  toWalletRef,
  transactionGet,
  transactionUpdate,
  transferDocument,
  walletDocument,
} from "./transfer-repository.test-helpers";
import { FirebaseTransferRepository } from "../firebase-transfer.repository";

beforeEach(setupTransferRepositoryMocks);

describe("FirebaseTransferRepository.deleteTransfer", () => {
  it("marks the transfer as deleted and reverts both balances", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transfer-1", transferDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 74.5 })),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-2", walletDocument({ balance: 125.5 })),
      );

    const repository = new FirebaseTransferRepository();
    const result = await repository.deleteTransfer("user-1", "transfer-1");

    expect(transactionUpdate).toHaveBeenCalledWith(
      fromWalletRef,
      expect.objectContaining({ balance: 100, updatedAt: expect.any(String) }),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      toWalletRef,
      expect.objectContaining({ balance: 100, updatedAt: expect.any(String) }),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "transfer", id: "transfer-1" },
      expect.objectContaining({
        deletedAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );

    expect(result.transfer.deletedAt).toEqual(expect.any(String));
    expect(result.wallets.map((wallet) => wallet.balance)).toEqual([100, 100]);
  });

  it("rejects missing or already deleted transfers", async () => {
    const repository = new FirebaseTransferRepository();

    transactionGet.mockResolvedValueOnce(snapshot("transfer-1"));
    await expect(
      repository.deleteTransfer("user-1", "transfer-1"),
    ).rejects.toMatchObject({ code: "TRANSFER_NOT_FOUND" });

    transactionGet.mockResolvedValueOnce(
      snapshot(
        "transfer-1",
        transferDocument({
          deletedAt: "2026-10-30T10:00:00.000Z",
        }),
      ),
    );
    await expect(
      repository.deleteTransfer("user-1", "transfer-1"),
    ).rejects.toMatchObject({ code: "TRANSFER_NOT_FOUND" });
  });

  it("rejects a transfer whose source wallet no longer exists", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transfer-1", transferDocument()))
      .mockResolvedValueOnce(snapshot("wallet-1"))
      .mockResolvedValueOnce(
        snapshot("wallet-2", walletDocument({ balance: 125.5 })),
      );

    const repository = new FirebaseTransferRepository();

    await expect(
      repository.deleteTransfer("user-1", "transfer-1"),
    ).rejects.toMatchObject({ code: "FROM_WALLET_NOT_FOUND" });

    expect(transactionUpdate).not.toHaveBeenCalled();
  });
});
