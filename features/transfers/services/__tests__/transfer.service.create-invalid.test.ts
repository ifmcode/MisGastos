import { describe, expect, it } from "@jest/globals";

import { TransferOperationError, TransferValidationError } from "../transfer.errors";
import {
  buildWallet,
  captureError,
  createService,
  validInput,
} from "./transfer-service.fixtures";

describe("TransferService.createTransfer rejections", () => {
  it("rejects a transfer when the source has insufficient balance", async () => {
    const { transferRepository, service } = createService({
      fromBalance: 10,
    });

    const error = await captureError(
      service.createTransfer("user-1", { ...validInput, amount: "10,01" }),
    );

    expect(error).toBeInstanceOf(TransferOperationError);
    if (!(error instanceof TransferOperationError)) return;

    expect(error.code).toBe("INSUFFICIENT_FUNDS");
    expect(transferRepository.createCalls).toEqual([]);
  });

  it("rejects wallets with different currencies", async () => {
    const { transferRepository, service } = createService({
      toCurrency: "USD",
    });

    const error = await captureError(
      service.createTransfer("user-1", validInput),
    );

    expect(error).toBeInstanceOf(TransferOperationError);
    if (!(error instanceof TransferOperationError)) return;

    expect(error.code).toBe("CURRENCY_MISMATCH");
    expect(transferRepository.createCalls).toEqual([]);
  });

  it("rejects a currency that does not match the wallets", async () => {
    const { service } = createService();

    const error = await captureError(
      service.createTransfer("user-1", { ...validInput, currency: "USD" }),
    );

    expect(error).toBeInstanceOf(TransferOperationError);
    if (!(error instanceof TransferOperationError)) return;

    expect(error.code).toBe("CURRENCY_MISMATCH");
  });

  it("rejects unknown source and destination wallets", async () => {
    const { walletRepository, service } = createService();
    walletRepository.wallets = [
      buildWallet({ id: "wallet-2", name: "Destino" }),
    ];

    const missingSource = await captureError(
      service.createTransfer("user-1", validInput),
    );

    expect(missingSource).toBeInstanceOf(TransferOperationError);
    if (!(missingSource instanceof TransferOperationError)) return;
    expect(missingSource.code).toBe("FROM_WALLET_NOT_FOUND");

    walletRepository.wallets = [buildWallet({ id: "wallet-1" })];

    const missingDestination = await captureError(
      service.createTransfer("user-1", validInput),
    );

    expect(missingDestination).toBeInstanceOf(TransferOperationError);
    if (!(missingDestination instanceof TransferOperationError)) return;
    expect(missingDestination.code).toBe("TO_WALLET_NOT_FOUND");
  });

  it("rejects invalid input before fetching wallets", async () => {
    const { walletRepository, transferRepository, service } = createService();

    const error = await captureError(
      service.createTransfer("user-1", {
        ...validInput,
        amount: "0",
        toWalletId: "wallet-1",
      }),
    );

    expect(error).toBeInstanceOf(TransferValidationError);
    if (!(error instanceof TransferValidationError)) return;

    expect(error.fieldErrors.amount).toBeDefined();
    expect(error.fieldErrors.toWalletId).toBeDefined();
    expect(walletRepository.getCalls).toEqual([]);
    expect(transferRepository.createCalls).toEqual([]);
  });

  it("requires an owner id and still reports field errors", async () => {
    const { walletRepository, transferRepository, service } = createService();

    const error = await captureError(
      service.createTransfer("   ", { ...validInput, currency: "BTC" }),
    );

    expect(error).toBeInstanceOf(TransferValidationError);
    if (!(error instanceof TransferValidationError)) return;

    expect(error.fieldErrors.ownerId).toBeDefined();
    expect(error.fieldErrors.currency).toBeDefined();
    expect(walletRepository.getCalls).toEqual([]);
    expect(transferRepository.createCalls).toEqual([]);
  });
});
