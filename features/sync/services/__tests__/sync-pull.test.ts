import { beforeEach, describe, expect, it, jest } from "@jest/globals";

export const mockGetWallets = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockGetTransactions = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockGetTransfers = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockCacheWallets = jest.fn<(...args: unknown[]) => Promise<void>>();
export const mockCacheTransactions = jest.fn<(...args: unknown[]) => Promise<void>>();
export const mockCacheTransfers = jest.fn<(...args: unknown[]) => Promise<void>>();

jest.mock("@/features/wallets/repositories/firebase-wallet.repository", () => ({
  FirebaseWalletRepository: jest.fn(() => ({ getWallets: mockGetWallets })),
}));
jest.mock("@/features/wallets/repositories/local-wallet.cache", () => ({
  cacheWallets: (...args: unknown[]) => mockCacheWallets(...args),
}));
jest.mock(
  "@/features/transactions/repositories/firebase-transaction.repository",
  () => ({
    FirebaseTransactionRepository: jest.fn(() => ({
      getTransactions: mockGetTransactions,
    })),
  }),
);
jest.mock("@/features/transactions/repositories/local-transaction.cache", () => ({
  cacheTransactions: (...args: unknown[]) => mockCacheTransactions(...args),
}));
jest.mock("@/features/transfers/repositories/firebase-transfer.repository", () => ({
  FirebaseTransferRepository: jest.fn(() => ({ getTransfers: mockGetTransfers })),
}));
jest.mock("@/features/transfers/repositories/local-transfer.cache", () => ({
  cacheTransfers: (...args: unknown[]) => mockCacheTransfers(...args),
}));
jest.mock("../sync-social-pull", () => ({
  pullSocialData: jest.fn(() => Promise.resolve()),
}));

import { pullOwnerData } from "../sync-pull";

const wallets = [{ id: "wallet-1" }];
const transactions = [{ id: "tx-1" }];
const transfers = [{ id: "transfer-1" }];

beforeEach(() => {
  jest.clearAllMocks();
  mockGetWallets.mockResolvedValue(wallets);
  mockGetTransactions.mockResolvedValue(transactions);
  mockGetTransfers.mockResolvedValue(transfers);
});

describe("pullOwnerData", () => {
  it("reads the three personal collections and mirrors them", async () => {
    await pullOwnerData("owner-1");

    expect(mockGetWallets).toHaveBeenCalledWith("owner-1");
    expect(mockGetTransactions).toHaveBeenCalledWith("owner-1");
    expect(mockGetTransfers).toHaveBeenCalledWith("owner-1");
    expect(mockCacheWallets).toHaveBeenCalledWith(
      "owner-1",
      wallets,
      expect.any(String),
    );
    expect(mockCacheTransactions).toHaveBeenCalledWith(
      "owner-1",
      transactions,
      expect.any(String),
    );
    expect(mockCacheTransfers).toHaveBeenCalledWith(
      "owner-1",
      transfers,
      expect.any(String),
    );
  });

  it("propagates a failed remote read so the engine can report it", async () => {
    mockGetTransactions.mockRejectedValue(new Error("offline"));

    await expect(pullOwnerData("owner-1")).rejects.toThrow("offline");
    expect(mockCacheWallets).not.toHaveBeenCalled();
  });
});
