import { Transfer } from "../../types/transfer.types";

export const LOCAL_TEST_OWNER = "owner-1";

export function buildTransfer(overrides: Partial<Transfer> = {}): Transfer {
  return {
    id: "transfer-1",
    fromWalletId: "wallet-1",
    toWalletId: "wallet-2",
    fromWalletName: "Cuenta principal",
    toWalletName: "Ahorros",
    amount: 40,
    currency: "EUR",
    date: "2026-10-30",
    notes: "Ahorro mensual",
    ownerId: LOCAL_TEST_OWNER,
    revision: 1,
    createdAt: "2026-10-30T10:00:00.000Z",
    updatedAt: "2026-10-30T11:00:00.000Z",
    ...overrides,
  };
}
