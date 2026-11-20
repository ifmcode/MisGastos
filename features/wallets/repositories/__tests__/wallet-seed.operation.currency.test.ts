import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the operation.
import {
  mockTransactionSet,
  setupWalletRepositoryMocks,
} from "./wallet-repository.test-helpers";
import {
  mockOwnerQueries,
  mockTransactionDocuments,
  seededWalletId,
  seedDto,
  seedProfile,
} from "./wallet-seed.test-helpers";
import { seedDefaultWalletDocument } from "../wallet-seed.operation";

beforeEach(setupWalletRepositoryMocks);

interface SeededWalletWrite {
  currency?: unknown;
}

/** Currency written for the seeded wallet document. */
function seededCurrency(): unknown {
  const walletWrite = mockTransactionSet.mock.calls.find(
    ([ref]) => (ref as { kind: string }).kind === "wallets",
  );

  return (walletWrite?.[1] as SeededWalletWrite | undefined)?.currency;
}

describe("seedDefaultWalletDocument currency", () => {
  it("uses the stored profile currency over the DTO currency", async () => {
    const profile = { ...seedProfile, preferredCurrency: "USD" };
    mockOwnerQueries([{ id: "profile-1", data: profile }]);
    mockTransactionDocuments({ "users/profile-1": profile });

    await seedDefaultWalletDocument("user-1", seedDto);

    expect(mockTransactionSet).toHaveBeenCalledWith(
      { kind: "wallets", id: seededWalletId },
      expect.objectContaining({ currency: "USD" }),
    );
    expect(seededCurrency()).toBe("USD");
  });

  it("falls back to the DTO currency when the stored one is invalid", async () => {
    const profile = { ...seedProfile, preferredCurrency: "XYZ" };
    mockOwnerQueries([{ id: "profile-1", data: profile }]);
    mockTransactionDocuments({ "users/profile-1": profile });

    await seedDefaultWalletDocument("user-1", {
      ...seedDto,
      currency: "GBP",
    });

    expect(seededCurrency()).toBe("GBP");
  });

  it("falls back to the DTO currency when the profile has none", async () => {
    const { preferredCurrency: _ignored, ...profile } = seedProfile;
    mockOwnerQueries([{ id: "profile-1", data: profile }]);
    mockTransactionDocuments({ "users/profile-1": profile });

    await seedDefaultWalletDocument("user-1", {
      ...seedDto,
      currency: "JPY",
    });

    expect(seededCurrency()).toBe("JPY");
  });
});
