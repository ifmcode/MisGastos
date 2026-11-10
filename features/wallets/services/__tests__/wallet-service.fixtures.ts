import { expect } from "@jest/globals";

import { WalletInput } from "../../schemas/wallet.schema";
import { Wallet } from "../../types/wallet.types";
import { WalletOperationCode, WalletOperationError } from "../wallet.errors";
import { WalletService } from "../wallet.service";
import { FakeWalletRepository } from "./wallet-service.fakes";

export const validInput: WalletInput = {
  name: "  Cuenta principal  ",
  currency: "EUR",
  icon: "wallet",
  color: "#0a7ea4",
  initialBalance: "100,50",
  type: "bank",
  includeInTotal: true,
  description: "  Nómina  ",
};

export function createService() {
  const repository = new FakeWalletRepository();
  return { repository, service: new WalletService(repository) };
}

export function buildWallet(overrides: Partial<Wallet> = {}): Wallet {
  return {
    id: "wallet-1",
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
    ...overrides,
  };
}

export async function captureError(
  promise: Promise<unknown>,
): Promise<unknown> {
  try {
    await promise;
  } catch (error: unknown) {
    return error;
  }

  throw new Error("Expected promise to reject");
}

export function expectOperationError(
  error: unknown,
  code: WalletOperationCode,
): void {
  expect(error).toBeInstanceOf(WalletOperationError);
  if (!(error instanceof WalletOperationError)) return;

  expect(error.code).toBe(code);
}
