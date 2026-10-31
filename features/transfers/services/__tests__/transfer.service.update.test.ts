import { describe, expect, it } from "@jest/globals";

import {
  TransferOperationError,
  TransferValidationError,
} from "../transfer.errors";
import {
  buildTransfer,
  captureError,
  createService,
  validInput,
} from "./transfer-service.fixtures";

describe("TransferService.updateTransfer", () => {
  it("validates and updates an existing transfer", async () => {
    const { walletRepository, transferRepository, service } = createService();
    transferRepository.transferById = buildTransfer();

    const result = await service.updateTransfer(
      "  user-1  ",
      "  transfer-1  ",
      { ...validInput, amount: "40" },
    );

    expect(walletRepository.getCalls).toEqual(["user-1"]);
    expect(transferRepository.getTransferCalls).toEqual([
      { ownerId: "user-1", transferId: "transfer-1" },
    ]);
    expect(transferRepository.updateCalls).toHaveLength(1);
    expect(transferRepository.updateCalls[0]).toEqual({
      ownerId: "user-1",
      transferId: "transfer-1",
      dto: {
        fromWalletId: "wallet-1",
        toWalletId: "wallet-2",
        amount: 40,
        currency: "EUR",
        notes: "Ahorro",
        date: "2026-10-29",
      },
    });
    expect(result.transfer.amount).toBe(40);
  });

  it("reverts the previous destination before using it as the new source", async () => {
    const { transferRepository, service } = createService();
    transferRepository.transferById = buildTransfer();

    const error = await captureError(
      service.updateTransfer("user-1", "transfer-1", {
        ...validInput,
        fromWalletId: "wallet-2",
        toWalletId: "wallet-1",
        amount: "30",
      }),
    );

    expect(error).toBeInstanceOf(TransferOperationError);
    if (!(error instanceof TransferOperationError)) return;

    expect(error.code).toBe("INSUFFICIENT_FUNDS");
    expect(transferRepository.updateCalls).toEqual([]);
  });

  it("rejects a transfer that does not belong to the user", async () => {
    const { walletRepository, transferRepository, service } = createService();

    const error = await captureError(
      service.updateTransfer("user-1", "transfer-1", validInput),
    );

    expect(error).toBeInstanceOf(TransferOperationError);
    if (!(error instanceof TransferOperationError)) return;

    expect(error.code).toBe("TRANSFER_NOT_FOUND");
    expect(transferRepository.updateCalls).toEqual([]);
    expect(walletRepository.getCalls).toEqual([]);
  });

  it("rejects invalid input before loading the transfer", async () => {
    const { transferRepository, service } = createService();

    await expect(
      service.updateTransfer("user-1", "transfer-1", {
        ...validInput,
        amount: "0",
      }),
    ).rejects.toBeInstanceOf(TransferValidationError);

    expect(transferRepository.getTransferCalls).toEqual([]);
    expect(transferRepository.updateCalls).toEqual([]);
  });

  it("propagates wallet repository failures", async () => {
    const { walletRepository, transferRepository, service } = createService();
    transferRepository.transferById = buildTransfer();
    const failure = new Error("wallet read failed");
    walletRepository.failure = failure;

    await expect(
      service.updateTransfer("user-1", "transfer-1", validInput),
    ).rejects.toBe(failure);
  });
});
