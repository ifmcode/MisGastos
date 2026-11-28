import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../local-wallet.cache", () => ({
  cacheWallets: jest.fn(),
  readCachedWallets: jest.fn(),
}));

import {
  cacheWallets,
  readCachedWallets,
} from "../local-wallet.cache";
import { CachedWalletRepository } from "../cached-wallet.repository";
import { IWalletRepository } from "../wallet.repository";
import { buildWallet } from "./local-wallet.fixtures";

const cacheMock = jest.mocked(cacheWallets);
const readCachedMock = jest.mocked(readCachedWallets);

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
    updateWalletOrders: jest.fn(),
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

  it("mirrors the server list and returns the derived cache", async () => {
    const serverWallets = [buildWallet({ balance: 150.5 })];
    const derived = [buildWallet({ balance: 125 })];
    remote.getWallets.mockResolvedValue(serverWallets);
    readCachedMock.mockResolvedValue(derived);

    await expect(repository.getWallets("owner-1")).resolves.toBe(derived);

    expect(remote.getWallets).toHaveBeenCalledWith("owner-1");
    expect(cacheMock).toHaveBeenCalledWith(
      "owner-1",
      serverWallets,
      expect.any(String),
    );
    expect(readCachedMock).toHaveBeenCalledWith("owner-1");
  });

  it("returns the remote list when the derived cache is unavailable", async () => {
    const wallets = [buildWallet()];
    remote.getWallets.mockResolvedValue(wallets);
    readCachedMock.mockResolvedValue(null);

    await expect(repository.getWallets("owner-1")).resolves.toBe(wallets);
  });

  it("does not reject when the cache write fails", async () => {
    const wallets = [buildWallet()];
    remote.getWallets.mockResolvedValue(wallets);
    cacheMock.mockRejectedValueOnce(new Error("disk full"));

    await expect(repository.getWallets("owner-1")).resolves.toBe(wallets);
    expect(readCachedMock).not.toHaveBeenCalled();
  });

  it("falls back to the derived cache when the remote read fails", async () => {
    const cached = [buildWallet({ balance: 90 })];
    remote.getWallets.mockRejectedValue(new Error("offline"));
    readCachedMock.mockResolvedValue(cached);

    await expect(repository.getWallets("owner-1")).resolves.toBe(cached);
    expect(cacheMock).not.toHaveBeenCalled();
  });

  it("rethrows the remote error when there is no cache", async () => {
    const error = new Error("offline");
    remote.getWallets.mockRejectedValue(error);
    readCachedMock.mockResolvedValue(null);

    await expect(repository.getWallets("owner-1")).rejects.toBe(error);
  });

  it("delegates getWallet without touching the cache", async () => {
    const wallet = buildWallet();
    remote.getWallet.mockResolvedValue(wallet);

    await expect(
      repository.getWallet("owner-1", "wallet-1"),
    ).resolves.toBe(wallet);
    expect(remote.getWallet).toHaveBeenCalledWith("owner-1", "wallet-1");
    expect(cacheMock).not.toHaveBeenCalled();
    expect(readCachedMock).not.toHaveBeenCalled();
  });
});
