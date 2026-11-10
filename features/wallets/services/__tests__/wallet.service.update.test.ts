import { describe, expect, it } from "@jest/globals";

import { WalletValidationError } from "../wallet.errors";
import {
  buildWallet,
  captureError,
  createService,
  expectOperationError,
  validInput,
} from "./wallet-service.fixtures";

describe("WalletService.updateWallet", () => {
  it("updates editable fields and the initial balance without movements", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];

    const wallet = await service.updateWallet("  user-1  ", " wallet-1 ", {
      ...validInput,
      name: "  Ahorros  ",
      initialBalance: "200,00",
    });

    expect(repository.updateCalls).toHaveLength(1);
    expect(repository.updateCalls[0]).toEqual({
      ownerId: "user-1",
      walletId: "wallet-1",
      dto: {
        name: "Ahorros",
        icon: "wallet",
        color: "#0A7EA4",
        type: "bank",
        includeInTotal: true,
        description: "Nómina",
        initialBalance: 200,
      },
    });
    expect(wallet.balance).toBe(200);
  });

  it("does not send the initial balance when it does not change", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];
    repository.usage = {
      transactionCount: 1,
      transferCount: 0,
      hasMovements: true,
    };

    await service.updateWallet("user-1", "wallet-1", {
      ...validInput,
      name: "Ahorros",
    });

    expect(repository.updateCalls[0].dto).not.toHaveProperty("initialBalance");
    expect(repository.usageCalls).toEqual([]);
  });

  it("locks the initial balance when the wallet has movements", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];
    repository.usage = {
      transactionCount: 1,
      transferCount: 0,
      hasMovements: true,
    };

    const error = await captureError(
      service.updateWallet("user-1", "wallet-1", {
        ...validInput,
        initialBalance: "200,00",
      }),
    );

    expectOperationError(error, "INITIAL_BALANCE_LOCKED");
    expect(repository.updateCalls).toEqual([]);
  });

  it("locks the currency because changing it would break movements", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];

    const error = await captureError(
      service.updateWallet("user-1", "wallet-1", {
        ...validInput,
        currency: "USD",
      }),
    );

    expectOperationError(error, "CURRENCY_LOCKED");
    expect(repository.updateCalls).toEqual([]);
  });

  it("rejects wallets owned by someone else", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet({ ownerId: "other-user" })];

    const error = await captureError(
      service.updateWallet("user-1", "wallet-1", validInput),
    );

    expectOperationError(error, "WALLET_NOT_FOUND");
    expect(repository.updateCalls).toEqual([]);
  });

  it("validates the input before touching the repository", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];

    const error = await captureError(
      service.updateWallet("user-1", "wallet-1", {
        ...validInput,
        name: "   ",
      }),
    );

    expect(error).toBeInstanceOf(WalletValidationError);
    expect(repository.updateCalls).toEqual([]);
  });
});
