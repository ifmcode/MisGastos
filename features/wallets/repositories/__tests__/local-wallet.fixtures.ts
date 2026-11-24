import { Wallet } from "../../types/wallet.types";

export const LOCAL_TEST_OWNER = "owner-1";

export function buildWallet(overrides: Partial<Wallet> = {}): Wallet {
  return {
    id: "wallet-1",
    name: "Cuenta principal",
    currency: "EUR",
    icon: "cash",
    color: "#0A7EA4",
    initialBalance: 100,
    balance: 150.5,
    type: "cash",
    includeInTotal: true,
    ownerId: LOCAL_TEST_OWNER,
    revision: 2,
    createdAt: "2026-10-28T10:00:00.000Z",
    updatedAt: "2026-10-28T11:00:00.000Z",
    description: "Gastos diarios",
    ...overrides,
  };
}
