import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module.
import {
  mockGetDoc,
  setupWalletRepositoryMocks,
  snapshot,
  walletDocument,
} from "./wallet-repository.test-helpers";
import { loadWalletMovements } from "../wallet-movements";
import { deleteWalletDocument } from "../wallet-deletion.operation";

jest.mock("../wallet-movements", () => ({
  loadWalletMovements: jest.fn(),
}));
jest.mock("../wallet-delete.orphan.operation", () => ({
  orphanWalletMovementsAndDelete: jest.fn(),
}));
jest.mock("../wallet-delete.reassign.operation", () => ({
  reassignWalletMovementsAndDelete: jest.fn(),
}));

const loadMovements = jest.mocked(loadWalletMovements);
const movements = { transactions: [{} as never], transfers: [] };

function mockWalletDocuments(
  documents: Record<string, Record<string, unknown> | null> = {},
) {
  mockGetDoc.mockImplementation(async (ref: unknown) => {
    const { id } = ref as { id: string };
    const data = id in documents ? documents[id] : walletDocument();
    return snapshot(id, data ?? undefined);
  });
}

beforeEach(() => {
  setupWalletRepositoryMocks();
  loadMovements.mockResolvedValue(movements);
});

describe("deleteWalletDocument guards", () => {
  it("rejects missing or foreign wallets", async () => {
    mockWalletDocuments({ "wallet-1": null });
    await expect(
      deleteWalletDocument("user-1", "wallet-1", { mode: "keep" }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });

    mockWalletDocuments({
      "wallet-1": walletDocument({ ownerId: "user-2" }),
    });
    await expect(
      deleteWalletDocument("user-1", "wallet-1", { mode: "keep" }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
  });

  it("validates the reassign target", async () => {
    mockWalletDocuments({ "wallet-2": null });

    await expect(
      deleteWalletDocument("user-1", "wallet-1", { mode: "reassign" }),
    ).rejects.toMatchObject({ code: "TARGET_WALLET_REQUIRED" });

    await expect(
      deleteWalletDocument("user-1", "wallet-1", {
        mode: "reassign",
        targetWalletId: "wallet-1",
      }),
    ).rejects.toMatchObject({ code: "TARGET_WALLET_SAME" });

    await expect(
      deleteWalletDocument("user-1", "wallet-1", {
        mode: "reassign",
        targetWalletId: "  wallet-2  ",
      }),
    ).rejects.toMatchObject({ code: "TARGET_WALLET_NOT_FOUND" });
  });

  it("rejects archived and incompatible targets", async () => {
    mockWalletDocuments({
      "wallet-2": walletDocument({ archivedAt: "2026-11-01" }),
    });
    await expect(
      deleteWalletDocument("user-1", "wallet-1", {
        mode: "reassign",
        targetWalletId: "wallet-2",
      }),
    ).rejects.toMatchObject({ code: "TARGET_WALLET_ARCHIVED" });

    mockWalletDocuments({
      "wallet-2": walletDocument({ currency: "USD" }),
    });
    await expect(
      deleteWalletDocument("user-1", "wallet-1", {
        mode: "reassign",
        targetWalletId: "wallet-2",
      }),
    ).rejects.toMatchObject({ code: "TARGET_WALLET_CURRENCY_MISMATCH" });
  });
});
