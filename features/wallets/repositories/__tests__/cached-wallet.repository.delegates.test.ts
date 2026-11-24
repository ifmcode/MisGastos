import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { CachedWalletRepository } from "../cached-wallet.repository";
import { IWalletRepository } from "../wallet.repository";
import {
  CreateWalletDto,
  DeleteWalletOptions,
} from "../../types/wallet.types";
import { buildWallet } from "./local-wallet.fixtures";

function createRemote(): jest.Mocked<IWalletRepository> {
  return {
    getWallets: jest.fn(),
    getWallet: jest.fn(),
    createWallet: jest.fn(),
    seedDefaultWallet: jest.fn(),
    updateWallet: jest.fn(),
    setWalletArchived: jest.fn(),
    getWalletUsage: jest.fn(),
    deleteWallet: jest.fn(),
  };
}

const dto: CreateWalletDto = {
  name: "Efectivo",
  currency: "EUR",
  icon: "cash",
  color: "#0A7EA4",
  initialBalance: 0,
  type: "cash",
  includeInTotal: true,
};

describe("CachedWalletRepository delegation", () => {
  let remote: jest.Mocked<IWalletRepository>;
  let repository: CachedWalletRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    remote = createRemote();
    repository = new CachedWalletRepository(remote);
  });

  it("delegates createWallet", async () => {
    const wallet = buildWallet();
    remote.createWallet.mockResolvedValue(wallet);

    await expect(repository.createWallet("owner-1", dto)).resolves.toBe(wallet);
    expect(remote.createWallet).toHaveBeenCalledWith("owner-1", dto);
  });

  it("delegates seedDefaultWallet", async () => {
    remote.seedDefaultWallet.mockResolvedValue({ status: "already-seeded" });

    await expect(
      repository.seedDefaultWallet("owner-1", dto),
    ).resolves.toEqual({ status: "already-seeded" });
    expect(remote.seedDefaultWallet).toHaveBeenCalledWith("owner-1", dto);
  });

  it("delegates updateWallet", async () => {
    const wallet = buildWallet();
    remote.updateWallet.mockResolvedValue(wallet);

    await expect(
      repository.updateWallet("owner-1", "wallet-1", { name: "Nueva" }),
    ).resolves.toBe(wallet);
    expect(remote.updateWallet).toHaveBeenCalledWith("owner-1", "wallet-1", {
      name: "Nueva",
    });
  });

  it("delegates setWalletArchived", async () => {
    const wallet = buildWallet();
    remote.setWalletArchived.mockResolvedValue(wallet);

    await expect(
      repository.setWalletArchived("owner-1", "wallet-1", "2026-11-01"),
    ).resolves.toBe(wallet);
    expect(remote.setWalletArchived).toHaveBeenCalledWith(
      "owner-1",
      "wallet-1",
      "2026-11-01",
    );
  });

  it("delegates getWalletUsage", async () => {
    const usage = {
      transactionCount: 2,
      transferCount: 1,
      hasMovements: true,
    };
    remote.getWalletUsage.mockResolvedValue(usage);

    await expect(
      repository.getWalletUsage("owner-1", "wallet-1"),
    ).resolves.toBe(usage);
    expect(remote.getWalletUsage).toHaveBeenCalledWith("owner-1", "wallet-1");
  });

  it("delegates deleteWallet", async () => {
    const options: DeleteWalletOptions = { mode: "keep" };
    const result = { deletedWalletId: "wallet-1" };
    remote.deleteWallet.mockResolvedValue(result);

    await expect(
      repository.deleteWallet("owner-1", "wallet-1", options),
    ).resolves.toBe(result);
    expect(remote.deleteWallet).toHaveBeenCalledWith(
      "owner-1",
      "wallet-1",
      options,
    );
  });
});
