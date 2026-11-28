import { describe, expect, it } from "@jest/globals";

import { WalletValidationError } from "../wallet.errors";
import {
  buildWallet,
  captureError,
  createService,
} from "./wallet-service.fixtures";

describe("WalletService.reorderWallets", () => {
  it("normalizes the owner and persists the requested order", async () => {
    const { repository, service } = createService();
    repository.wallets = [
      buildWallet({ id: "a", sortOrder: 0 }),
      buildWallet({ id: "b", sortOrder: 1 }),
      buildWallet({ id: "c", sortOrder: 2 }),
    ];

    await service.reorderWallets("  user-1  ", ["c", "a", "b"]);

    expect(repository.orderCalls).toEqual([
      {
        ownerId: "user-1",
        updates: [
          { id: "c", sortOrder: 0 },
          { id: "a", sortOrder: 1 },
          { id: "b", sortOrder: 2 },
        ],
      },
    ]);
  });

  it("persists only the entries whose position changed", async () => {
    const { repository, service } = createService();
    repository.wallets = [
      buildWallet({ id: "a", sortOrder: 0 }),
      buildWallet({ id: "b", sortOrder: 1 }),
      buildWallet({ id: "c", sortOrder: 2 }),
    ];

    await service.reorderWallets("user-1", ["a", "c", "b"]);

    expect(repository.orderCalls[0]?.updates).toEqual([
      { id: "c", sortOrder: 1 },
      { id: "b", sortOrder: 2 },
    ]);
  });

  it("normalizes legacy wallets to explicit positions on the first move", async () => {
    const { repository, service } = createService();
    repository.wallets = [
      buildWallet({
        id: "newer",
        createdAt: "2026-10-28T11:00:00.000Z",
      }),
      buildWallet({
        id: "older",
        createdAt: "2026-10-28T09:00:00.000Z",
      }),
    ];

    await service.reorderWallets("user-1", ["older", "newer"]);

    expect(repository.orderCalls[0]?.updates).toEqual([
      { id: "older", sortOrder: 0 },
      { id: "newer", sortOrder: 1 },
    ]);
  });

  it("ignores unknown and duplicated ids and appends missing wallets", async () => {
    const { repository, service } = createService();
    repository.wallets = [
      buildWallet({ id: "a", sortOrder: 0 }),
      buildWallet({ id: "b", sortOrder: 1 }),
      buildWallet({ id: "c", sortOrder: 2 }),
    ];

    await service.reorderWallets("user-1", ["c", "c", " ", "missing", "a"]);

    expect(repository.orderCalls[0]?.updates).toEqual([
      { id: "c", sortOrder: 0 },
      { id: "a", sortOrder: 1 },
      { id: "b", sortOrder: 2 },
    ]);
  });

  it("skips the write when the order did not change", async () => {
    const { repository, service } = createService();
    repository.wallets = [
      buildWallet({ id: "a", sortOrder: 0 }),
      buildWallet({ id: "b", sortOrder: 1 }),
    ];

    await service.reorderWallets("user-1", ["a", "b"]);

    expect(repository.orderCalls).toHaveLength(0);
  });

  it("does nothing for an owner without wallets", async () => {
    const { repository, service } = createService();

    await service.reorderWallets("user-1", ["a"]);

    expect(repository.getCalls).toEqual(["user-1"]);
    expect(repository.orderCalls).toHaveLength(0);
  });

  it("rejects an empty owner without reading or writing", async () => {
    const { repository, service } = createService();

    const error = await captureError(service.reorderWallets(" ", ["a"]));

    expect(error).toBeInstanceOf(WalletValidationError);
    expect(repository.getCalls).toHaveLength(0);
    expect(repository.orderCalls).toHaveLength(0);
  });

  it("propagates repository failures", async () => {
    const { repository, service } = createService();
    const failure = new Error("permission-denied");
    repository.failure = failure;

    await expect(service.reorderWallets("user-1", ["a"])).rejects.toBe(failure);
    expect(repository.orderCalls).toHaveLength(0);
  });

  it("propagates a batch write failure", async () => {
    const { repository, service } = createService();
    repository.wallets = [
      buildWallet({ id: "a", sortOrder: 0 }),
      buildWallet({ id: "b", sortOrder: 1 }),
    ];
    const failure = new Error("unavailable");
    repository.orderFailure = failure;

    await expect(service.reorderWallets("user-1", ["b", "a"])).rejects.toBe(
      failure,
    );
    expect(repository.orderCalls).toHaveLength(1);
  });
});
