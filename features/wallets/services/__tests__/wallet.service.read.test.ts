import { describe, expect, it } from "@jest/globals";

import { Wallet } from "../../types/wallet.types";
import { WalletValidationError } from "../wallet.errors";
import { createService, validInput } from "./wallet-service.fixtures";

describe("WalletService.getWallets", () => {
  it("trims the owner id and delegates to the repository", async () => {
    const { repository, service } = createService();
    const wallets = [
      {
        ...validInput,
        id: "wallet-1",
        balance: 100.5,
        ownerId: "user-1",
        createdAt: "2026-10-28T10:00:00.000Z",
        updatedAt: "2026-10-28T10:00:00.000Z",
      },
    ] as Wallet[];
    repository.wallets = wallets;

    await expect(service.getWallets("  user-1  ")).resolves.toEqual(wallets);
    expect(repository.getCalls).toEqual(["user-1"]);
  });

  it("rejects an empty owner id without calling the repository", async () => {
    const { repository, service } = createService();

    await expect(service.getWallets("   ")).rejects.toBeInstanceOf(
      WalletValidationError,
    );
    expect(repository.getCalls).toEqual([]);
  });

  it("propagates repository failures", async () => {
    const { repository, service } = createService();
    const failure = new Error("firestore unavailable");
    repository.failure = failure;

    await expect(service.getWallets("user-1")).rejects.toBe(failure);
  });
});
