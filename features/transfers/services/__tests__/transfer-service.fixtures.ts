import { Wallet } from "@/features/wallets/types/wallet.types";

import { TransferInput } from "../../schemas/transfer.schema";
import { Transfer } from "../../types/transfer.types";
import { TransferService } from "../transfer.service";
import {
  FakeTransferRepository,
  FakeWalletRepository,
} from "./transfer-service.fakes";

export function buildWallet(overrides: Partial<Wallet>): Wallet {
  return {
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
    ...overrides,
  };
}

export const validInput: TransferInput = {
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: "25,50",
  currency: "EUR",
  notes: "  Ahorro  ",
  date: "29/10/2026",
};

export function buildTransfer(overrides: Partial<Transfer> = {}): Transfer {
  return {
    id: "transfer-1",
    fromWalletId: "wallet-1",
    toWalletId: "wallet-2",
    amount: 25.5,
    currency: "EUR",
    date: "2026-10-29",
    notes: "Ahorro",
    ownerId: "user-1",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
    ...overrides,
  };
}

export function createService(options?: {
  fromBalance?: number;
  toCurrency?: Wallet["currency"];
}) {
  const walletRepository = new FakeWalletRepository();
  const transferRepository = new FakeTransferRepository();

  walletRepository.wallets = [
    buildWallet({
      id: "wallet-1",
      name: "Origen",
      balance: options?.fromBalance ?? 100,
    }),
    buildWallet({
      id: "wallet-2",
      name: "Destino",
      balance: 50,
      currency: options?.toCurrency ?? "EUR",
    }),
  ];

  return {
    walletRepository,
    transferRepository,
    service: new TransferService(transferRepository, walletRepository),
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
