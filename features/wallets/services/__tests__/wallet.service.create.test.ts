import { describe, expect, it } from "@jest/globals";

import { WalletValidationError } from "../wallet.errors";
import {
  captureError,
  createService,
  validInput,
} from "./wallet-service.fixtures";

describe("WalletService.createWallet", () => {
  it("validates, normalizes and persists the wallet with its initial balance", async () => {
    const { repository, service } = createService();

    const wallet = await service.createWallet("  user-1  ", validInput);

    expect(repository.createCalls).toHaveLength(1);
    expect(repository.createCalls[0]).toEqual({
      ownerId: "user-1",
      dto: {
        name: "Cuenta principal",
        currency: "EUR",
        icon: "wallet",
        color: "#0A7EA4",
        initialBalance: 100.5,
        type: "bank",
        includeInTotal: true,
        description: "Nómina",
      },
    });
    expect(wallet.balance).toBe(100.5);
    expect(wallet.initialBalance).toBe(100.5);
    expect(wallet.ownerId).toBe("user-1");
  });

  it("defaults the initial balance to zero", async () => {
    const { repository, service } = createService();

    const wallet = await service.createWallet("user-1", {
      ...validInput,
      initialBalance: "",
    });

    expect(wallet.balance).toBe(0);
    expect(repository.createCalls[0].dto.initialBalance).toBe(0);
  });

  it("throws validation errors and does not persist invalid data", async () => {
    const { repository, service } = createService();

    const error = await captureError(
      service.createWallet("user-1", {
        ...validInput,
        name: "   ",
        initialBalance: "-1",
      }),
    );

    expect(error).toBeInstanceOf(WalletValidationError);
    if (!(error instanceof WalletValidationError)) return;

    expect(error.fieldErrors.name).toBeDefined();
    expect(error.fieldErrors.initialBalance).toBeDefined();
    expect(repository.createCalls).toEqual([]);
  });

  it("requires an owner id and still reports field errors", async () => {
    const { repository, service } = createService();

    const error = await captureError(
      service.createWallet("   ", { ...validInput, currency: "BTC" }),
    );

    expect(error).toBeInstanceOf(WalletValidationError);
    if (!(error instanceof WalletValidationError)) return;

    expect(error.fieldErrors.ownerId).toBeDefined();
    expect(error.fieldErrors.currency).toBeDefined();
    expect(repository.createCalls).toEqual([]);
  });

  it("propagates repository failures", async () => {
    const { repository, service } = createService();
    const failure = new Error("write failed");
    repository.failure = failure;

    await expect(
      service.createWallet("user-1", validInput),
    ).rejects.toBe(failure);
  });
});
