import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-transfer.repository", () => ({
  FirebaseTransferRepository: jest.fn(() => ({ kind: "transfer-repository" })),
}));
jest.mock("@/features/wallets/repositories/firebase-wallet.repository", () => ({
  FirebaseWalletRepository: jest.fn(() => ({ kind: "wallet-repository" })),
}));

import { getTransferService } from "../transfer.factory";

describe("getTransferService", () => {
  it("reuses one TransferService instance", () => {
    const service = getTransferService();

    expect(getTransferService()).toBe(service);
  });
});
