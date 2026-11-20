import { buildDefaultWalletId } from "../../utils/default-wallet";
import {
  mockCollection,
  mockGetDocs,
  mockQuery,
  mockTransactionGet,
  snapshot,
} from "./wallet-repository.test-helpers";

export const seededWalletId = buildDefaultWalletId("user-1");

export const seedProfile = {
  uid: "user-1",
  name: "Ana",
  email: "ana@example.com",
  preferredCurrency: "EUR",
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
};

export const seedDto = {
  name: "Cartera principal",
  currency: "EUR" as const,
  icon: "wallet",
  color: "#0A7EA4",
  initialBalance: 0,
  type: "cash" as const,
  includeInTotal: true,
};

export interface DocumentStub {
  id: string;
  data: Record<string, unknown>;
}

/** Routes the two owner queries (profile and wallets) to fake document lists. */
export function mockOwnerQueries(
  profiles: DocumentStub[] = [],
  wallets: DocumentStub[] = [],
): void {
  mockCollection.mockImplementation((...args: unknown[]) => ({
    path: String(args[1]),
  }));
  mockQuery.mockImplementation((...args: unknown[]) => ({
    collection: args[0] as { path: string },
  }));
  mockGetDocs.mockImplementation(async (target: unknown) => {
    const { path } = (target as { collection: { path: string } }).collection;
    const documents = path === "users" ? profiles : wallets;

    return {
      docs: documents.map((document) => ({
        id: document.id,
        data: () => document.data,
      })),
    };
  });
}

/** Transaction reads are keyed by `collection/id`, like the mocked doc refs. */
export function mockTransactionDocuments(
  documents: Record<string, Record<string, unknown> | undefined> = {},
): void {
  mockTransactionGet.mockImplementation(async (ref: unknown) => {
    const { kind, id } = ref as { kind: string; id: string };
    return snapshot(id, documents[`${kind}/${id}`]);
  });
}

/** Document references read inside the transaction, in call order. */
export function transactionReads(): unknown[] {
  return mockTransactionGet.mock.calls.map(([ref]) => ref);
}
