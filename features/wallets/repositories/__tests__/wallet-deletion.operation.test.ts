import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module.
import {
  mockDeleteDoc,
  mockGetDoc,
  setupWalletRepositoryMocks,
  snapshot,
  walletDocument,
} from "./wallet-repository.test-helpers";
import { loadWalletMovements } from "../wallet-movements";
import { orphanWalletMovementsAndDelete } from "../wallet-delete.orphan.operation";
import { reassignWalletMovementsAndDelete } from "../wallet-delete.reassign.operation";
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
const orphan = jest.mocked(orphanWalletMovementsAndDelete);
const reassign = jest.mocked(reassignWalletMovementsAndDelete);

const source = {
  id: "wallet-1",
  name: "Cuenta principal",
  currency: "EUR",
  icon: "wallet",
  color: "#0A7EA4",
  initialBalance: 100,
  balance: 100,
  type: "bank",
  includeInTotal: true,
  ownerId: "user-1",
  createdAt: "2026-10-28T10:00:00.000Z",
  updatedAt: "2026-10-28T10:00:00.000Z",
} as const;
const target = { ...source, id: "wallet-2" };
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
  loadMovements.mockResolvedValue({ transactions: [], transfers: [] });
  orphan.mockResolvedValue();
  reassign.mockResolvedValue(target);
});

describe("deleteWalletDocument", () => {
  it("deletes a wallet without movements directly", async () => {
    mockWalletDocuments();

    const result = await deleteWalletDocument("user-1", "wallet-1", {
      mode: "reassign",
    });

    expect(mockDeleteDoc).toHaveBeenCalledWith({
      kind: "wallets",
      id: "wallet-1",
    });
    expect(orphan).not.toHaveBeenCalled();
    expect(reassign).not.toHaveBeenCalled();
    expect(result).toEqual({ deletedWalletId: "wallet-1" });
  });

  it("orphans the movements in keep mode", async () => {
    mockWalletDocuments();
    loadMovements.mockResolvedValue(movements);

    const result = await deleteWalletDocument("user-1", "wallet-1", {
      mode: "keep",
    });

    expect(orphan).toHaveBeenCalledWith(source, movements);
    expect(result).toEqual({ deletedWalletId: "wallet-1" });
  });

  it("reassigns the movements and returns the updated target", async () => {
    mockWalletDocuments();
    loadMovements.mockResolvedValue(movements);

    const result = await deleteWalletDocument("user-1", "wallet-1", {
      mode: "reassign",
      targetWalletId: "wallet-2",
    });

    expect(reassign).toHaveBeenCalledWith("user-1", source, target, movements);
    expect(result).toEqual({
      deletedWalletId: "wallet-1",
      targetWallet: target,
    });
  });
});
