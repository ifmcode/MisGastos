import { describe, expect, it } from "@jest/globals";

import { createService, validInput } from "./transfer-service.fixtures";

describe("TransferService.createTransfer", () => {
  it("validates wallets and creates the transfer", async () => {
    const { walletRepository, transferRepository, service } = createService();

    const result = await service.createTransfer("  user-1  ", validInput);

    expect(walletRepository.getCalls).toEqual(["user-1"]);
    expect(transferRepository.createCalls).toHaveLength(1);
    expect(transferRepository.createCalls[0]).toEqual({
      ownerId: "user-1",
      dto: {
        fromWalletId: "wallet-1",
        toWalletId: "wallet-2",
        amount: 25.5,
        currency: "EUR",
        notes: "Ahorro",
        date: "2026-10-29",
      },
    });
    expect(result.transfer.amount).toBe(25.5);
  });

  it("propagates wallet repository failures", async () => {
    const { walletRepository, service } = createService();
    const failure = new Error("wallet read failed");
    walletRepository.failure = failure;

    await expect(
      service.createTransfer("user-1", validInput),
    ).rejects.toBe(failure);
  });

  it("propagates transfer repository failures", async () => {
    const { transferRepository, service } = createService();
    const failure = new Error("transfer write failed");
    transferRepository.failure = failure;

    await expect(
      service.createTransfer("user-1", validInput),
    ).rejects.toBe(failure);
  });
});
