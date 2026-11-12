import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module.
import {
  mockGetDoc,
  mockUpdateDoc,
  setupWalletRepositoryMocks,
  snapshot,
  walletDocument,
} from "./wallet-repository.test-helpers";
import {
  setWalletArchivedDocument,
  updateWalletDocument,
} from "../wallet-write.operations";

beforeEach(setupWalletRepositoryMocks);

describe("updateWalletDocument", () => {
  it("rejects missing or foreign wallets", async () => {
    mockGetDoc.mockResolvedValueOnce(snapshot("wallet-1"));
    await expect(
      updateWalletDocument("user-1", "wallet-1", { name: "Nueva" }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });

    mockGetDoc.mockResolvedValueOnce(
      snapshot("wallet-1", walletDocument({ ownerId: "user-2" })),
    );
    await expect(
      updateWalletDocument("user-1", "wallet-1", { name: "Nueva" }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
  });

  it("patches the provided fields and deletes an empty description", async () => {
    mockGetDoc
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ name: "Nueva" })),
      );

    const wallet = await updateWalletDocument("user-1", "wallet-1", {
      name: "Nueva",
      icon: "cash",
      color: "#000000",
      type: "cash",
      includeInTotal: false,
      description: "   ",
      initialBalance: 50.555,
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { kind: "wallets", id: "wallet-1" },
      expect.objectContaining({
        name: "Nueva",
        icon: "cash",
        color: "#000000",
        type: "cash",
        includeInTotal: false,
        description: { kind: "delete-field" },
        initialBalance: 50.56,
        balance: 50.56,
        updatedAt: expect.any(String),
      }),
    );
    expect(wallet.name).toBe("Nueva");
  });

  it("keeps a trimmed description and rejects a vanished wallet", async () => {
    mockGetDoc
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument()))
      .mockResolvedValueOnce(snapshot("wallet-1"));

    await expect(
      updateWalletDocument("user-1", "wallet-1", { description: "  Hola  " }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { kind: "wallets", id: "wallet-1" },
      expect.objectContaining({ description: "Hola" }),
    );
  });
});

describe("setWalletArchivedDocument", () => {
  it("sets and clears the archive marker", async () => {
    mockGetDoc
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument()))
      .mockResolvedValueOnce(
        snapshot(
          "wallet-1",
          walletDocument({ archivedAt: "2026-11-12T10:00:00.000Z" }),
        ),
      );

    const archived = await setWalletArchivedDocument(
      "user-1",
      "wallet-1",
      "2026-11-12T10:00:00.000Z",
    );

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { kind: "wallets", id: "wallet-1" },
      expect.objectContaining({
        archivedAt: "2026-11-12T10:00:00.000Z",
      }),
    );
    expect(archived.archivedAt).toBe("2026-11-12T10:00:00.000Z");

    mockGetDoc
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ archivedAt: "2026-11-12" })),
      )
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument()));

    await setWalletArchivedDocument("user-1", "wallet-1", null);

    expect(mockUpdateDoc).toHaveBeenLastCalledWith(
      { kind: "wallets", id: "wallet-1" },
      expect.objectContaining({ archivedAt: { kind: "delete-field" } }),
    );
  });

  it("rejects missing wallets before and after the update", async () => {
    mockGetDoc.mockResolvedValueOnce(snapshot("wallet-1"));
    await expect(
      setWalletArchivedDocument("user-1", "wallet-1", null),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });

    mockGetDoc
      .mockResolvedValueOnce(snapshot("wallet-1", walletDocument()))
      .mockResolvedValueOnce(snapshot("wallet-1"));
    await expect(
      setWalletArchivedDocument("user-1", "wallet-1", null),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
  });
});
