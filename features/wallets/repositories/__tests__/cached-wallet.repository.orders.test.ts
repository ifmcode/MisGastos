import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../local-wallet.cache", () => ({
  cacheWallets: jest.fn(),
  readCachedWallets: jest.fn(),
  updateCachedWalletOrders: jest.fn(),
}));

import { updateCachedWalletOrders } from "../local-wallet.cache";
import { CachedWalletRepository } from "../cached-wallet.repository";
import { IWalletRepository } from "../wallet.repository";

const updateCachedMock = jest.mocked(updateCachedWalletOrders);

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

const updates = [
  { id: "wallet-1", sortOrder: 0 },
  { id: "wallet-2", sortOrder: 1 },
];

describe("CachedWalletRepository.updateWalletOrders", () => {
  let remote: jest.Mocked<IWalletRepository>;
  let repository: CachedWalletRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    remote = createRemote();
    remote.updateWalletOrders.mockResolvedValue(undefined);
    updateCachedMock.mockResolvedValue(undefined);
    repository = new CachedWalletRepository(remote);
  });

  it("persists the remote batch before updating the local cache", async () => {
    const calls: string[] = [];
    remote.updateWalletOrders.mockImplementation(async () => {
      calls.push("remote");
    });
    updateCachedMock.mockImplementation(async () => {
      calls.push("local");
    });

    await expect(
      repository.updateWalletOrders("owner-1", updates),
    ).resolves.toBeUndefined();

    expect(calls).toEqual(["remote", "local"]);
    expect(remote.updateWalletOrders).toHaveBeenCalledWith("owner-1", updates);
    expect(updateCachedMock).toHaveBeenCalledWith("owner-1", updates);
  });

  it("swallows a local cache failure once the server persisted", async () => {
    updateCachedMock.mockRejectedValue(new Error("disk full"));

    await expect(
      repository.updateWalletOrders("owner-1", updates),
    ).resolves.toBeUndefined();
    expect(updateCachedMock).toHaveBeenCalledTimes(1);
  });

  it("propagates a remote failure without touching the cache", async () => {
    const failure = new Error("permission-denied");
    remote.updateWalletOrders.mockRejectedValue(failure);

    await expect(
      repository.updateWalletOrders("owner-1", updates),
    ).rejects.toBe(failure);
    expect(updateCachedMock).not.toHaveBeenCalled();
  });
});
