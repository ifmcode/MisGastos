import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module.
import {
  mockAddDoc,
  setupWalletRepositoryMocks,
} from "./wallet-repository.test-helpers";
import { createWalletDocument } from "../wallet-write.operations";

beforeEach(setupWalletRepositoryMocks);

const dto = {
  name: "Cuenta principal",
  currency: "EUR" as const,
  icon: "wallet",
  color: "#0A7EA4",
  initialBalance: 100.555,
  type: "bank" as const,
  includeInTotal: true,
};

describe("createWalletDocument", () => {
  it("writes a rounded mirrored balance and timestamps", async () => {
    mockAddDoc.mockResolvedValue({ id: "wallet-1" });

    const wallet = await createWalletDocument("user-1", dto);

    expect(mockAddDoc).toHaveBeenCalledWith(
      { path: "collection" },
      expect.objectContaining({
        balance: 100.56,
        initialBalance: 100.56,
        ownerId: "user-1",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
    expect(wallet).toMatchObject({ id: "wallet-1", balance: 100.56 });
  });

  it("includes only non-empty descriptions", async () => {
    mockAddDoc.mockResolvedValue({ id: "wallet-1" });

    await createWalletDocument("user-1", { ...dto, description: "Nómina" });
    expect(mockAddDoc.mock.calls[0]?.[1]).toHaveProperty(
      "description",
      "Nómina",
    );

    await createWalletDocument("user-1", { ...dto, description: "" });
    expect(mockAddDoc.mock.calls[1]?.[1]).not.toHaveProperty("description");
  });
});
