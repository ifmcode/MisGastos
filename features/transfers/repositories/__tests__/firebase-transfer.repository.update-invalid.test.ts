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

describe("FirebaseTransferRepository.updateTransfer rejections", () => {
  it("rejects an update that would overdraw the new source", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transfer-1", transferDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 10 })),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-2", walletDocument({ balance: 50 })),
      );

    const repository = new FirebaseTransferRepository();

    await expect(
      repository.updateTransfer("user-1", "transfer-1", {
        ...validDto,
        amount: 40,
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" });

    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects wallets with different currencies", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transfer-1", transferDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 100 })),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-2", walletDocument({ currency: "USD" })),
      );

    const repository = new FirebaseTransferRepository();

    await expect(
      repository.updateTransfer("user-1", "transfer-1", validDto),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });

    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects missing, foreign or already deleted transfers", async () => {
    const repository = new FirebaseTransferRepository();

    transactionGet.mockResolvedValueOnce(snapshot("transfer-1"));
    await expect(
      repository.updateTransfer("user-1", "transfer-1", validDto),
    ).rejects.toMatchObject({ code: "TRANSFER_NOT_FOUND" });

    transactionGet.mockResolvedValueOnce(
      snapshot("transfer-1", transferDocument({ ownerId: "user-2" })),
    );
    await expect(
      repository.updateTransfer("user-1", "transfer-1", validDto),
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
      repository.updateTransfer("user-1", "transfer-1", validDto),
    ).rejects.toMatchObject({ code: "TRANSFER_NOT_FOUND" });
  });
});
