import { jest } from "@jest/globals";

export const mockGetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockGetDocs = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockSetDoc = jest.fn<(...args: unknown[]) => Promise<void>>();
export const mockDoc = jest.fn<(...args: unknown[]) => unknown>();
export const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
export const mockQuery = jest.fn<(...args: unknown[]) => unknown>();
export const mockWhere = jest.fn<(...args: unknown[]) => unknown>();
export const mockRunTransaction = jest.fn<
  (
    db: unknown,
    callback: (transaction: unknown) => Promise<unknown>,
  ) => Promise<unknown>
>();

jest.mock("firebase/firestore", () => ({
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  runTransaction: (
    database: unknown,
    callback: (transaction: unknown) => Promise<unknown>,
  ) => mockRunTransaction(database, callback),
}));

jest.mock("@/lib/firebase", () => ({ db: {} }));

export const transactionGet = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const transactionSet = jest.fn<(...args: unknown[]) => void>();
export const transactionUpdate = jest.fn<(...args: unknown[]) => void>();
const mockTransaction = {
  get: transactionGet,
  set: transactionSet,
  update: transactionUpdate,
};

export const GROUP_ID = "user-a__group-1";
export const SETTLEMENT_ID = "group-settlement-1";
export const MOVEMENT_ID = "movement-1";
export const WALLET_ID = "wallet-1";
export const NOW = "2026-11-20T10:00:00.000Z";

export function settlementRef(id = SETTLEMENT_ID) {
  return { kind: "group-settlement", id };
}

export function movementRef(id = MOVEMENT_ID) {
  return { kind: "transaction", id };
}

export function walletRef(id = WALLET_ID) {
  return { kind: "wallet", id };
}

export function notificationRef(id = "notification-1") {
  return { kind: "notification", id };
}

export function activityRef(id = "activity-1") {
  return { kind: "activity", id };
}

export function snapshot(id: string, data?: Record<string, unknown>) {
  return { id, exists: () => data !== undefined, data: () => data };
}

export function missingSnapshot(id = "") {
  return snapshot(id);
}

export function querySnapshot(
  documents: Array<{ id: string; data: () => unknown }>,
): { docs: Array<{ id: string; data: () => unknown }> } {
  return { docs: documents };
}

export function groupSettlementDocument(overrides: Record<string, unknown> = {}) {
  return {
    groupId: GROUP_ID,
    participantIds: ["user-b", "user-c"],
    pairId: "user-b__user-c",
    fromUserId: "user-b",
    toUserId: "user-c",
    amountCents: 1000,
    currency: "EUR",
    date: "2026-11-10",
    note: "Dinner",
    createdBy: "user-b",
    createdAt: "2026-11-10T20:00:00.000Z",
    updatedAt: "2026-11-10T20:00:00.000Z",
    deletedAt: null,
    receiverWalletId: null,
    receiverCategoryId: null,
    receiverTransactionId: null,
    ...overrides,
  };
}

export function walletDocument(overrides: Record<string, unknown> = {}) {
  return {
    name: "Main",
    currency: "EUR",
    icon: "wallet",
    color: "#0A7EA4",
    initialBalance: 100,
    balance: 100,
    type: "bank",
    includeInTotal: true,
    ownerId: "user-c",
    createdAt: "2026-10-28T10:00:00.000Z",
    updatedAt: "2026-10-28T10:00:00.000Z",
    ...overrides,
  };
}

export function movementDocument(overrides: Record<string, unknown> = {}) {
  return {
    type: "income",
    amount: 10,
    currency: "EUR",
    walletId: WALLET_ID,
    categoryId: "category-1",
    concept: "Dinner",
    date: "2026-11-10",
    groupSettlementId: SETTLEMENT_ID,
    ownerId: "user-c",
    createdAt: "2026-11-10T20:00:00.000Z",
    updatedAt: "2026-11-10T20:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

type Reference = { kind: string; id: string };

function buildReference(collectionName: string, id: string): Reference {
  if (collectionName === "wallets") return walletRef(id);
  if (collectionName === "transactions") return movementRef(id);
  if (collectionName === "notifications") return notificationRef(id);
  if (collectionName === "groups") return activityRef(id);

  return settlementRef(id);
}

/** Resets the mocks and restores the deterministic reference shapes. */
export function setupGroupSettlementMocks() {
  jest.resetAllMocks();
  mockCollection.mockImplementation((_db: unknown, name: unknown) => ({
    path: String(name),
  }));
  mockQuery.mockReturnValue({ path: "query" });
  mockWhere.mockReturnValue({ path: "where" });
  mockGetDoc.mockResolvedValue(missingSnapshot());
  mockSetDoc.mockResolvedValue(undefined);
  mockDoc.mockImplementation((...args: unknown[]) => {
    if (args.length === 1) {
      const path = (args[0] as { path?: string }).path ?? "";

      if (path === "groups") return activityRef("activity-new");
      if (path === "transactions") return movementRef("movement-new");

      return settlementRef("settlement-new");
    }

    const [, name, id] = args as [unknown, string, string];

    return buildReference(name, id);
  });
  mockRunTransaction.mockImplementation(async (_db, callback) =>
    callback(mockTransaction),
  );
}

/** Last `update`/`set` payload of one reference, for concise assertions. */
export function lastWriteOf(
  mock: typeof transactionUpdate | typeof transactionSet,
  reference: Reference,
): Record<string, unknown> | undefined {
  const call = [...mock.mock.calls].reverse().find((entry) => {
    const ref = entry[0] as { kind?: string; id?: string } | undefined;

    return ref?.kind === reference.kind && ref?.id === reference.id;
  });

  return call?.[1] as Record<string, unknown> | undefined;
}

/** Payload the best-effort notification writer sent for one reference. */
export function notificationWriteOf(
  reference: Reference,
): Record<string, unknown> | undefined {
  const call = [...mockSetDoc.mock.calls].reverse().find((entry) => {
    const ref = entry[0] as { kind?: string; id?: string } | undefined;

    return ref?.kind === reference.kind && ref?.id === reference.id;
  });

  return call?.[1] as Record<string, unknown> | undefined;
}
