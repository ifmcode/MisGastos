import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module.
import {
  mockDoc,
  mockTransactionGet,
  setupWalletRepositoryMocks,
  snapshot,
  walletDocument,
} from "@/features/wallets/repositories/__tests__/wallet-repository.test-helpers";
import {
  addBalanceAdjustment,
  loadTransferWallets,
  toTransferData,
  toWalletBalance,
} from "../transfer-firestore.utils";

beforeEach(setupWalletRepositoryMocks);

const dto = {
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: 25.555,
  currency: "EUR" as const,
  date: "2026-10-29",
  notes: "  Ahorro  ",
};

describe("transfer firestore utils", () => {
  it("reads the balance with the initial balance fallback", () => {
    expect(toWalletBalance({ balance: 10.555 })).toBe(10.56);
    expect(toWalletBalance({ initialBalance: 20 })).toBe(20);
    expect(toWalletBalance({})).toBe(0);
  });

  it("trims notes and rounds the amount", () => {
    expect(toTransferData("user-1", dto, "now")).toMatchObject({
      amount: 25.56,
      notes: "Ahorro",
    });
    expect(
      toTransferData("user-1", { ...dto, notes: "   " }, "now"),
    ).not.toHaveProperty("notes");
  });

  it("ignores orphaned wallets and accumulates adjustments", () => {
    const adjustments = new Map<string, number>();
    addBalanceAdjustment(adjustments, "-1", 100);
    addBalanceAdjustment(adjustments, "wallet-1", 10);
    addBalanceAdjustment(adjustments, "wallet-1", 5.555);

    expect(adjustments.has("-1")).toBe(false);
    expect(adjustments.get("wallet-1")).toBe(15.56);
  });

  it("loads wallets and skips orphaned ids", async () => {
    mockTransactionGet.mockResolvedValue(
      snapshot("wallet-1", walletDocument()),
    );

    const wallets = await loadTransferWallets({
      transaction: { get: mockTransactionGet } as never,
      ownerId: "user-1",
      walletIds: ["-1", "wallet-1"],
      fromWalletId: "wallet-1",
      toWalletId: "wallet-2",
      previousFromWalletId: "wallet-1",
    });

    expect(mockDoc).toHaveBeenCalledWith(
      { name: "test-db" },
      "wallets",
      "wallet-1",
    );
    expect(mockTransactionGet).toHaveBeenCalledTimes(1);
    expect(wallets.get("wallet-1")).toMatchObject({ ownerId: "user-1" });
  });

  it("maps missing wallets to the correct side", async () => {
    const options = {
      transaction: { get: mockTransactionGet } as never,
      ownerId: "user-1",
      walletIds: ["wallet-1"],
      fromWalletId: "wallet-1",
      toWalletId: "wallet-2",
      previousFromWalletId: "wallet-1",
    };
    mockTransactionGet.mockResolvedValueOnce(snapshot("wallet-1"));
    await expect(loadTransferWallets(options)).rejects.toMatchObject({
      code: "FROM_WALLET_NOT_FOUND",
    });

    mockTransactionGet.mockResolvedValueOnce(snapshot("wallet-2"));
    await expect(
      loadTransferWallets({
        ...options,
        walletIds: ["wallet-2"],
        fromWalletId: "wallet-1",
        toWalletId: "wallet-2",
        previousFromWalletId: "wallet-1",
      }),
    ).rejects.toMatchObject({ code: "TO_WALLET_NOT_FOUND" });

    mockTransactionGet.mockResolvedValueOnce(snapshot("wallet-3"));
    await expect(
      loadTransferWallets({
        ...options,
        walletIds: ["wallet-3"],
        previousFromWalletId: "wallet-3",
      }),
    ).rejects.toMatchObject({ code: "FROM_WALLET_NOT_FOUND" });

    mockTransactionGet.mockResolvedValueOnce(snapshot("wallet-3"));
    await expect(
      loadTransferWallets({
        ...options,
        walletIds: ["wallet-3"],
        previousFromWalletId: "wallet-1",
      }),
    ).rejects.toMatchObject({ code: "TO_WALLET_NOT_FOUND" });
  });

  it("rejects wallets owned by another user", async () => {
    mockTransactionGet.mockResolvedValue(
      snapshot("wallet-1", walletDocument({ ownerId: "user-2" })),
    );

    await expect(
      loadTransferWallets({
        transaction: { get: mockTransactionGet } as never,
        ownerId: "user-1",
        walletIds: ["wallet-1"],
        fromWalletId: "wallet-1",
        toWalletId: "wallet-2",
        previousFromWalletId: "wallet-1",
      }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
  });
});
