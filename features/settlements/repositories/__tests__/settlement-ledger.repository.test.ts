import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../firebase-settlements.repository", () => ({
  FirebaseSettlementsRepository: jest.fn(() => ({
    getSettlements: async () => [],
  })),
}));

import { SettlementLedgerRepository } from "../settlement-ledger.repository";
import type { ISettlementsRepository } from "../settlements.repository";
import { buildSettlement } from "./settlement-document.fixtures";

function fakeRepository(settlements: Awaited<ReturnType<ISettlementsRepository["getSettlements"]>>) {
  return {
    getSettlements: jest.fn(async () => settlements),
  } as unknown as ISettlementsRepository;
}

describe("SettlementLedgerRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("emits the reverse edge of every active settlement", async () => {
    const repository = fakeRepository([
      buildSettlement({ id: "active" }),
      buildSettlement({ id: "deleted", deletedAt: "2026-11-16T10:00:00.000Z" }),
    ]);

    const entries = await new SettlementLedgerRepository(repository).getEntries(
      "user-a",
    );

    expect(entries).toEqual([
      {
        id: "settlement:active",
        fromUserId: "user-b",
        toUserId: "user-a",
        amountCents: 1000,
        currency: "EUR",
        deletedAt: null,
      },
    ]);
  });

  it("uses the Firestore repository by default", async () => {
    await expect(new SettlementLedgerRepository().getEntries("user-a")).resolves.toEqual(
      [],
    );
  });
});
