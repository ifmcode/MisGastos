import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../local-wallet.cache", () => ({
  cacheWallets: jest.fn(),
}));

import { cacheWallets } from "../local-wallet.cache";
import { CachedWalletRepository } from "../cached-wallet.repository";
import { IWalletRepository } from "../wallet.repository";
import { buildWallet } from "./local-wallet.fixtures";

const cacheMock = jest.mocked(cacheWallets);

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

describe("CachedWalletRepository list reads", () => {
  let remote: jest.Mocked<IWalletRepository>;
  let repository: CachedWalletRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    remote = createRemote();
    repository = new CachedWalletRepository(remote);
  });

  it("mirrors the list read and returns the remote list", async () => {
    const wallets = [buildWallet()];
    remote.getWallets.mockResolvedValue(wallets);

    await expect(repository.getWallets("owner-1")).resolves.toBe(wallets);

    expect(remote.getWallets).toHaveBeenCalledWith("owner-1");
    expect(cacheMock).toHaveBeenCalledWith(
      "owner-1",
      wallets,
      expect.any(String),
    );
  });

  it("does not reject when the cache write fails", async () => {
    const wallets = [buildWallet()];
    remote.getWallets.mockResolvedValue(wallets);
    cacheMock.mockRejectedValueOnce(new Error("disk full"));

    await expect(repository.getWallets("owner-1")).resolves.toBe(wallets);
  });

  it("delegates getWallet without touching the cache", async () => {
    const wallet = buildWallet();
    remote.getWallet.mockResolvedValue(wallet);

    await expect(
      repository.getWallet("owner-1", "wallet-1"),
    ).resolves.toBe(wallet);
    expect(remote.getWallet).toHaveBeenCalledWith("owner-1", "wallet-1");
    expect(cacheMock).not.toHaveBeenCalled();
  });
});
