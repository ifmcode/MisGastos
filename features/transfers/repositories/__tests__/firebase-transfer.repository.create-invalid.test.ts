import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the repository.
import {
  mockRunTransaction,
  mockWalletSnapshots,
  setupTransferRepositoryMocks,
  snapshot,
  transactionGet,
  transactionSet,
  transactionUpdate,
  validDto,
  walletDocument,
} from "./transfer-repository.test-helpers";
import { FirebaseTransferRepository } from "../firebase-transfer.repository";

beforeEach(setupTransferRepositoryMocks);

describe("FirebaseTransferRepository.createTransfer rejections", () => {
  it("rejects a transfer without enough balance and writes nothing", async () => {
    mockWalletSnapshots({ balance: 10 });

    const repository = new FirebaseTransferRepository();

    await expect(
      repository.createTransfer("user-1", validDto),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" });

    expect(transactionSet).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects transfers between wallets with different currencies", async () => {
    mockWalletSnapshots({}, { currency: "USD" });

    const repository = new FirebaseTransferRepository();

    await expect(
      repository.createTransfer("user-1", validDto),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });

    expect(transactionSet).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects the same wallet as source and destination", async () => {
    const repository = new FirebaseTransferRepository();

    await expect(
      repository.createTransfer("user-1", {
        ...validDto,
        toWalletId: "wallet-1",
      }),
    ).rejects.toMatchObject({ code: "SAME_WALLET" });

    expect(transactionGet).not.toHaveBeenCalled();
  });

  it("rejects invalid amounts", async () => {
    const repository = new FirebaseTransferRepository();

    await expect(
      repository.createTransfer("user-1", { ...validDto, amount: 0 }),
    ).rejects.toMatchObject({ code: "TRANSFER_INVALID" });
  });

  it("rejects wallets that no longer exist", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("wallet-1"))
      .mockResolvedValueOnce(snapshot("wallet-2", walletDocument()));

    const repository = new FirebaseTransferRepository();

    await expect(
      repository.createTransfer("user-1", validDto),
    ).rejects.toMatchObject({ code: "FROM_WALLET_NOT_FOUND" });
  });

  it("rejects wallets owned by another user", async () => {
    mockWalletSnapshots({}, { ownerId: "user-2" });

    const repository = new FirebaseTransferRepository();

    await expect(
      repository.createTransfer("user-1", validDto),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
  });

  it("propagates Firestore transaction failures", async () => {
    const failure = new Error("transaction failed");
    mockRunTransaction.mockRejectedValue(failure);

    const repository = new FirebaseTransferRepository();

    await expect(
      repository.createTransfer("user-1", validDto),
    ).rejects.toBe(failure);
  });
});
