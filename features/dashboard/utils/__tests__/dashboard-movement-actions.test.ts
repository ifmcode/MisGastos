import { describe, expect, it, jest } from "@jest/globals";

import { Transaction } from "@/features/transactions/types/transaction.types";

import {
  createDashboardMovementActions,
  DashboardMovementDialogPort,
} from "../dashboard-movement-actions";

function buildTransaction(): Transaction {
  return {
    id: "transaction-1",
    type: "expense",
    amount: 20,
    currency: "EUR",
    walletId: "wallet-1",
    categoryId: "category-1",
    concept: "Cena",
    date: "2026-11-13",
    ownerId: "user-1",
    createdAt: "2026-11-13T10:00:00.000Z",
    updatedAt: "2026-11-13T10:00:00.000Z",
  };
}

function createPort() {
  const calls: string[] = [];
  const port: DashboardMovementDialogPort = {
    clearMutationState: jest.fn<() => void>(() => {
      calls.push("clear");
    }),
    openDetail: jest.fn<(transaction: Transaction) => void>(() => {
      calls.push("detail");
    }),
    closeDetail: jest.fn<() => void>(() => {
      calls.push("close");
    }),
    openEdit: jest.fn<(transaction: Transaction) => void>(() => {
      calls.push("edit");
    }),
  };

  return { port, calls };
}

describe("createDashboardMovementActions", () => {
  it("clears the mutation state before opening the detail", () => {
    const { port, calls } = createPort();
    const transaction = buildTransaction();
    const actions = createDashboardMovementActions(port);

    actions.openDetail(transaction);

    expect(calls).toEqual(["clear", "detail"]);
    expect(port.openDetail).toHaveBeenCalledWith(transaction);
  });

  it("closes the detail before opening the edit form", () => {
    const { port, calls } = createPort();
    const transaction = buildTransaction();
    const actions = createDashboardMovementActions(port);

    actions.editFromDetail(transaction);

    expect(calls).toEqual(["close", "edit"]);
    expect(port.openEdit).toHaveBeenCalledWith(transaction);
    expect(port.openDetail).not.toHaveBeenCalled();
  });
});
