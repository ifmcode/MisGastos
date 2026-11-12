import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-wallet.repository", () => ({
  FirebaseWalletRepository: jest.fn(() => ({ kind: "wallet-repository" })),
}));

import { getWalletService } from "../wallet.factory";

describe("getWalletService", () => {
  it("reuses one WalletService instance", () => {
    const service = getWalletService();

    expect(getWalletService()).toBe(service);
  });
});
