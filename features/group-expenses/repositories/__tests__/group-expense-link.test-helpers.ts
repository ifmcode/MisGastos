import { jest } from "@jest/globals";

export const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
export const mockDoc = jest.fn<(...args: unknown[]) => unknown>();
export const mockRunTransaction = jest.fn<
  (
    db: unknown,
    callback: (transaction: unknown) => Promise<unknown>,
  ) => Promise<unknown>
>();

jest.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: jest.fn(),
  runTransaction: (
    database: unknown,
    callback: (transaction: unknown) => Promise<unknown>,
  ) => mockRunTransaction(database, callback),
}));

jest.mock("@/lib/firebase", () => ({ db: { name: "test-db" } }));

export const transactionGet = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const transactionSet = jest.fn<(...args: unknown[]) => void>();
export const transactionUpdate = jest.fn<(...args: unknown[]) => void>();
const mockTransaction = {
  get: transactionGet,
  set: transactionSet,
  update: transactionUpdate,
};

export const EXPENSE_ID = "group-expense-1";
export const MOVEMENT_ID = "movement-1";
export const WALLET_ID = "wallet-1";
export const OTHER_WALLET_ID = "wallet-2";
export const VIEWER = "user-a";
export const NOW = "2026-11-16T10:00:00.000Z";

export function expenseRef(id = EXPENSE_ID) {
  return { kind: "groupExpense", id };
}

export function movementRef(id = MOVEMENT_ID) {
  return { kind: "transaction", id };
}

export function activityRef(id = "activity-1") {
  return { kind: "activity", id };
}

export function walletRef(id = WALLET_ID) {
  return { kind: "wallet", id };
}

export function snapshot(id: string, data?: Record<string, unknown>) {
  return { id, exists: () => data !== undefined, data: () => data };
}

export function missingSnapshot(id = "") {
  return snapshot(id);
}

export function walletDocument(overrides: Record<string, unknown> = {}) {
  return {
    name: "Cuenta principal",
    currency: "EUR",
    icon: "wallet",
    color: "#0A7EA4",
    initialBalance: 100,
    balance: 100,
    type: "bank",
    includeInTotal: true,
    ownerId: VIEWER,
    createdAt: "2026-10-28T10:00:00.000Z",
    updatedAt: "2026-10-28T10:00:00.000Z",
    ...overrides,
  };
}

export function movementDocument(overrides: Record<string, unknown> = {}) {
  return {
    type: "expense",
    amount: 10,
    currency: "EUR",
    walletId: WALLET_ID,
    categoryId: "category-1",
    concept: "Dinner",
    date: "2026-11-10",
    groupExpenseId: EXPENSE_ID,
    ownerId: VIEWER,
    createdAt: "2026-11-10T20:00:00.000Z",
    updatedAt: "2026-11-10T20:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

/** Resets the mocks and restores the deterministic reference shapes. */
export function setupLinkOperationMocks() {
  jest.resetAllMocks();

  mockCollection.mockImplementation((_db: unknown, name: unknown) => ({
    path: String(name),
  }));
  mockDoc.mockImplementation((...args: unknown[]) => {
    if (args.length === 1) {
      const path = (args[0] as { path?: string }).path ?? "";

      if (path === "groups") return activityRef("activity-new");
      if (path === "groupExpenses") return expenseRef("group-expense-new");

      return movementRef("movement-new");
    }

    const [, name, id] = args as [unknown, string, string];
    if (name === "wallets") return walletRef(id);
    if (name === "transactions") return movementRef(id);

    return expenseRef(id);
  });
  mockRunTransaction.mockImplementation(async (_db, callback) =>
    callback(mockTransaction),
  );
}
