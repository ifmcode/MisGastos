import { describe, expect, it } from "@jest/globals";

import { WalletValidationError } from "../wallet.errors";
import {
  buildWallet,
  captureError,
  createService,
  expectOperationError,
} from "./wallet-service.fixtures";

describe("WalletService archive and restore", () => {
  it("archives a wallet with an ISO timestamp", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];

    const wallet = await service.archiveWallet("  user-1  ", " wallet-1 ");

    expect(repository.archiveCalls).toHaveLength(1);
    expect(repository.archiveCalls[0]).toMatchObject({
      ownerId: "user-1",
      walletId: "wallet-1",
    });
    expect(repository.archiveCalls[0].archivedAt).toEqual(expect.any(String));
    expect(wallet.archivedAt).toBe(repository.archiveCalls[0].archivedAt);
  });

  it("restores a wallet by clearing its archived marker", async () => {
    const { repository, service } = createService();
    repository.wallets = [
      buildWallet({ archivedAt: "2026-11-01T10:00:00.000Z" }),
    ];

    const wallet = await service.restoreWallet("user-1", "wallet-1");

    expect(repository.archiveCalls[0].archivedAt).toBeNull();
    expect(wallet.archivedAt).toBeUndefined();
  });

  it("rejects wallets owned by someone else", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet({ ownerId: "other-user" })];

    const error = await captureError(
      service.archiveWallet("user-1", "wallet-1"),
    );

    expectOperationError(error, "WALLET_NOT_FOUND");
    expect(repository.archiveCalls).toHaveLength(1);
    expect(repository.wallets[0].archivedAt).toBeUndefined();
  });

  it("requires an owner id without calling the repository", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];

    const error = await captureError(service.archiveWallet("   ", "wallet-1"));

    expect(error).toBeInstanceOf(WalletValidationError);
    expect(repository.archiveCalls).toEqual([]);
  });
});
