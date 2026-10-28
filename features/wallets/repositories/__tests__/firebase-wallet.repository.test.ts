import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { CreateWalletDto } from "../../types/wallet.types";
import { FirebaseWalletRepository } from "../firebase-wallet.repository";

const mockAddDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
const mockGetDocs = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockOrderBy = jest.fn<(...args: unknown[]) => unknown>();
const mockQuery = jest.fn<(...args: unknown[]) => unknown>();

jest.mock("firebase/firestore", () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  query: (...args: unknown[]) => mockQuery(...args),
}));

jest.mock("@/lib/firebase", () => ({ db: { name: "test-db" } }));

const validDto: CreateWalletDto = {
  name: "Cuenta principal",
  currency: "EUR",
  icon: "wallet",
  color: "#0A7EA4",
  initialBalance: 100.5,
  type: "bank",
  includeInTotal: true,
  description: "Nómina",
};

const validDocumentData: Record<string, unknown> = {
  name: "Cuenta principal",
  currency: "EUR",
  icon: "wallet",
  color: "#0A7EA4",
  initialBalance: 100.5,
  balance: 100.5,
  type: "bank",
  includeInTotal: true,
  ownerId: "user-1",
  createdAt: "2026-10-28T10:00:00.000Z",
  updatedAt: "2026-10-28T10:00:00.000Z",
  description: "Nómina",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCollection.mockReturnValue({ path: "wallets-collection" });
  mockOrderBy.mockReturnValue({ field: "createdAt" });
  mockQuery.mockReturnValue({ path: "wallets-query" });
});

describe("FirebaseWalletRepository.getWallets", () => {
  it("queries the user's wallets ordered by creation date", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "wallet-1",
          data: () => validDocumentData,
        },
        {
          id: "broken",
          data: () => ({ name: "" }),
        },
      ],
    });

    const repository = new FirebaseWalletRepository();
    const wallets = await repository.getWallets("user-1");

    expect(mockCollection).toHaveBeenCalledWith(
      { name: "test-db" },
      "users",
      "user-1",
      "wallets",
    );
    expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(mockQuery).toHaveBeenCalledWith(
      { path: "wallets-collection" },
      { field: "createdAt" },
    );
    expect(mockGetDocs).toHaveBeenCalledWith({ path: "wallets-query" });
    expect(wallets).toHaveLength(1);
    expect(wallets[0]).toMatchObject({
      id: "wallet-1",
      name: "Cuenta principal",
      balance: 100.5,
      ownerId: "user-1",
    });
  });

  it("propagates Firestore failures", async () => {
    const failure = new Error("permission-denied");
    mockGetDocs.mockRejectedValue(failure);

    const repository = new FirebaseWalletRepository();

    await expect(repository.getWallets("user-1")).rejects.toBe(failure);
  });
});

describe("FirebaseWalletRepository.createWallet", () => {
  it("writes the wallet with owner, mirrored balance and timestamps", async () => {
    mockAddDoc.mockResolvedValue({ id: "wallet-2" });

    const repository = new FirebaseWalletRepository();
    const wallet = await repository.createWallet("user-1", validDto);

    expect(mockAddDoc).toHaveBeenCalledWith(
      { path: "wallets-collection" },
      expect.objectContaining({
        name: "Cuenta principal",
        currency: "EUR",
        icon: "wallet",
        color: "#0A7EA4",
        initialBalance: 100.5,
        balance: 100.5,
        type: "bank",
        includeInTotal: true,
        ownerId: "user-1",
        description: "Nómina",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );

    expect(wallet).toMatchObject({
      id: "wallet-2",
      ownerId: "user-1",
      initialBalance: 100.5,
      balance: 100.5,
    });
    expect(wallet.createdAt).toBe(wallet.updatedAt);
  });

  it("does not write an undefined description", async () => {
    mockAddDoc.mockResolvedValue({ id: "wallet-3" });

    const repository = new FirebaseWalletRepository();
    await repository.createWallet("user-1", {
      ...validDto,
      description: undefined,
    });

    const payload = mockAddDoc.mock.calls[0]?.[1];

    expect(payload).not.toHaveProperty("description");
  });

  it("propagates Firestore failures", async () => {
    const failure = new Error("write failed");
    mockAddDoc.mockRejectedValue(failure);

    const repository = new FirebaseWalletRepository();

    await expect(
      repository.createWallet("user-1", validDto),
    ).rejects.toBe(failure);
  });
});
