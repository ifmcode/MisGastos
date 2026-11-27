import { beforeEach, describe, expect, it } from "@jest/globals";

import type { FriendLedgerEntry } from "@/features/friends/types/friend.types";

import { SettlementsService } from "../settlements.service";
import {
  FakeSettlementsRepository,
  fakeFriendsRepository,
  fakeLedgerRepository,
} from "./settlement-service.fakes";

let repository: FakeSettlementsRepository;

function entry(
  overrides: Partial<FriendLedgerEntry> = {},
): FriendLedgerEntry {
  return {
    id: "expense-entry",
    fromUserId: "user-a",
    toUserId: "user-b",
    amountCents: 1000,
    currency: "EUR",
    deletedAt: null,
    ...overrides,
  };
}

function buildService(
  entries: FriendLedgerEntry[],
  isFriend = true,
): SettlementsService {
  repository = new FakeSettlementsRepository();

  return new SettlementsService(
    repository,
    fakeFriendsRepository(isFriend),
    fakeLedgerRepository(entries),
  );
}

const input = {
  friendUid: "user-b",
  currency: "EUR",
  amount: "10,00",
  date: "2026-11-16",
  note: "Dinner",
};

describe("createSettlement - debtor pays", () => {
  it("derives the direction from the debt and notifies the creditor", async () => {
    const service = buildService([entry()]);

    const settlement = await service.createSettlement("user-a", input);

    expect(repository.created).toHaveLength(1);
    expect(repository.created[0].dto).toMatchObject({
      pairId: "user-a__user-b",
      participantIds: ["user-a", "user-b"],
      fromUserId: "user-a",
      toUserId: "user-b",
      amountCents: 1000,
      createdBy: "user-a",
      deletedAt: null,
      receiverWalletId: null,
      receiverCategoryId: null,
      receiverTransactionId: null,
    });
    expect(repository.created[0].notification).toMatchObject({
      userId: "user-b",
      type: "settlement-created",
      payload: {
        friendUid: "user-a",
        amountCents: 1000,
        currency: "EUR",
        isFull: true,
        canLinkWallet: true,
      },
    });
    expect(settlement.id).toBe("created-1");
  });

  it("marks a partial settlement as not full", async () => {
    const service = buildService([entry({ amountCents: 5000 })]);

    await service.createSettlement("user-a", { ...input, amount: "12,50" });

    expect(repository.created[0].notification.payload.isFull).toBe(false);
    expect(repository.created[0].dto.amountCents).toBe(1250);
  });
});

describe("createSettlement - creditor records the payment", () => {
  it("links the creditor wallet and notifies the debtor", async () => {
    const service = buildService([entry({ fromUserId: "user-b", toUserId: "user-a" })]);

    await service.createSettlement("user-a", {
      ...input,
      walletId: "wallet-1",
      categoryId: "category-1",
    });

    expect(repository.created[0].dto).toMatchObject({
      fromUserId: "user-b",
      toUserId: "user-a",
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
    });
    expect(repository.created[0].notification).toMatchObject({
      userId: "user-b",
      payload: { friendUid: "user-a", canLinkWallet: false },
    });
  });

  it("rejects a wallet sent by the debtor", async () => {
    const service = buildService([entry()]);

    await expect(
      service.createSettlement("user-a", {
        ...input,
        walletId: "wallet-1",
        categoryId: "category-1",
      }),
    ).rejects.toMatchObject({
      fieldErrors: { walletId: "WALLET_NOT_OWNED" },
    });
    expect(repository.created).toHaveLength(0);
  });
});

describe("createSettlement - guards", () => {
  it("requires a signed-in viewer", async () => {
    const service = buildService([entry()]);

    await expect(service.createSettlement("  ", input)).rejects.toMatchObject({
      code: "SIGN_IN_REQUIRED",
    });
  });

  it("requires an accepted friend", async () => {
    const service = buildService([entry()], false);

    await expect(service.createSettlement("user-a", input)).rejects.toMatchObject({
      code: "FRIEND_NOT_FOUND",
    });
  });

  it("rejects a currency without debt", async () => {
    const service = buildService([entry()]);

    await expect(
      service.createSettlement("user-a", { ...input, currency: "USD" }),
    ).rejects.toMatchObject({ code: "NO_DEBT" });
  });

  it("rejects an amount above the outstanding debt", async () => {
    const service = buildService([entry({ amountCents: 1000 })]);

    await expect(
      service.createSettlement("user-a", { ...input, amount: "10,01" }),
    ).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_DEBT" });
  });

  it("surfaces the schema issues", async () => {
    const service = buildService([entry()]);

    await expect(
      service.createSettlement("user-a", { ...input, amount: "" }),
    ).rejects.toMatchObject({ fieldErrors: { amount: "AMOUNT_REQUIRED" } });
  });
});

describe("read helpers", () => {
  it("sorts the viewer settlements and filters the pair", async () => {
    const service = buildService([entry()]);
    repository.settlements = [
      {
        id: "older",
        pairId: "user-a__user-b",
        participantIds: ["user-a", "user-b"],
        fromUserId: "user-a",
        toUserId: "user-b",
        amountCents: 100,
        currency: "EUR",
        date: "2026-11-01",
        note: "",
        createdBy: "user-a",
        createdAt: "2026-11-01T10:00:00.000Z",
        updatedAt: "2026-11-01T10:00:00.000Z",
        deletedAt: null,
        receiverWalletId: null,
        receiverCategoryId: null,
        receiverTransactionId: null,
        revision: 0,
      },
      {
        id: "newer",
        pairId: "user-a__user-c",
        participantIds: ["user-a", "user-c"],
        fromUserId: "user-a",
        toUserId: "user-c",
        amountCents: 100,
        currency: "EUR",
        date: "2026-11-10",
        note: "",
        createdBy: "user-a",
        createdAt: "2026-11-10T10:00:00.000Z",
        updatedAt: "2026-11-10T10:00:00.000Z",
        deletedAt: null,
        receiverWalletId: null,
        receiverCategoryId: null,
        receiverTransactionId: null,
        revision: 0,
      },
    ];

    expect((await service.getSettlements("user-a")).map((row) => row.id)).toEqual([
      "newer",
      "older",
    ]);
    expect(
      (await service.getPairSettlements("user-a", "user-b")).map((row) => row.id),
    ).toEqual(["older"]);
    await expect(service.getSettlement("user-a", "missing")).rejects.toMatchObject({
      code: "SETTLEMENT_NOT_FOUND",
    });
    await expect(service.getSettlement("user-c", "older")).rejects.toMatchObject({
      code: "NOT_PARTICIPANT",
    });
  });
});
