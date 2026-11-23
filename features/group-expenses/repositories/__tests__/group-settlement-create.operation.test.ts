import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module under test.
import {
  GROUP_ID,
  NOW,
  WALLET_ID,
  lastWriteOf,
  missingSnapshot,
  mockGetDoc,
  mockRunTransaction,
  mockSetDoc,
  movementRef,
  notificationRef,
  notificationWriteOf,
  setupGroupSettlementMocks,
  settlementRef,
  snapshot,
  transactionGet,
  transactionSet,
  transactionUpdate,
  walletDocument,
  walletRef,
} from "./group-settlements-repository.test-helpers";
import { createGroupSettlementOperation } from "../group-settlement-create.operation";
import type {
  CreateGroupSettlementDto,
  GroupSettlement,
} from "../../types/group-settlement.types";

beforeEach(setupGroupSettlementMocks);

const NEW_SETTLEMENT_ID = "settlement-new";
const NEW_MOVEMENT_ID = "movement-new";
const NOTIFICATION_ID = `group-settlement:${NEW_SETTLEMENT_ID}:created:${NOW}`;

function buildDto(
  overrides: Partial<CreateGroupSettlementDto> = {},
): CreateGroupSettlementDto {
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
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    receiverWalletId: null,
    receiverCategoryId: null,
    receiverTransactionId: null,
    ...overrides,
  };
}

function buildNotification(settlement: GroupSettlement) {
  return {
    userId: "user-c",
    type: "group-settlement" as const,
    payload: {
      settlementId: settlement.id,
      groupId: settlement.groupId,
      groupName: "Viaje",
      friendUid: "user-b",
      amountCents: settlement.amountCents,
      currency: settlement.currency,
    },
    dedupeKey: `group-settlement:${settlement.id}:created:${settlement.updatedAt}`,
    createdAt: settlement.updatedAt,
  };
}

function run(overrides: Partial<CreateGroupSettlementDto> = {}) {
  return createGroupSettlementOperation(
    buildDto(overrides),
    buildNotification,
  );
}

const creditorLink = {
  receiverWalletId: WALLET_ID,
  receiverCategoryId: "category-1",
};

describe("createGroupSettlementOperation - social-only", () => {
  it("writes the settlement and the notification without touching a wallet", async () => {
    const settlement = await run();

    expect(settlement).toMatchObject({
      id: NEW_SETTLEMENT_ID,
      groupId: GROUP_ID,
      amountCents: 1000,
      receiverTransactionId: null,
    });
    expect(
      lastWriteOf(transactionSet, settlementRef(NEW_SETTLEMENT_ID)),
    ).toMatchObject({
      groupId: GROUP_ID,
      participantIds: ["user-b", "user-c"],
      pairId: "user-b__user-c",
      fromUserId: "user-b",
      toUserId: "user-c",
      receiverWalletId: null,
      receiverTransactionId: null,
    });
    expect(notificationWriteOf(notificationRef(NOTIFICATION_ID))).toMatchObject({
      userId: "user-c",
      type: "group-settlement",
      payload: expect.objectContaining({
        settlementId: NEW_SETTLEMENT_ID,
        amountCents: 1000,
      }),
    });
    expect(
      lastWriteOf(transactionSet, movementRef(NEW_MOVEMENT_ID)),
    ).toBeUndefined();
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
  });

  it("skips the notification when its dedupe key already exists", async () => {
    mockGetDoc.mockResolvedValue(
      snapshot(NOTIFICATION_ID, { userId: "user-c" }),
    );

    await run();

    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("never rolls back the money write when the notification fails", async () => {
    mockGetDoc.mockRejectedValue(new Error("permission-denied"));

    const settlement = await run();

    expect(settlement.id).toBe(NEW_SETTLEMENT_ID);
    expect(
      lastWriteOf(transactionSet, settlementRef(NEW_SETTLEMENT_ID)),
    ).toBeDefined();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("fails without returning a malformed record", async () => {
    await expect(run({ amountCents: 0 })).rejects.toMatchObject({
      code: "SETTLEMENT_NOT_FOUND",
    });
  });
});

describe("createGroupSettlementOperation - creditor wallet", () => {
  it("applies the income with a group settlement link and one balance write", async () => {
    transactionGet.mockResolvedValue(
      snapshot(WALLET_ID, walletDocument({ balance: 100 })),
    );

    const settlement = await run(creditorLink);

    expect(settlement).toMatchObject({
      receiverWalletId: WALLET_ID,
      receiverCategoryId: "category-1",
      receiverTransactionId: NEW_MOVEMENT_ID,
    });
    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toMatchObject({
      balance: 110,
      updatedAt: NOW,
    });
    expect(
      lastWriteOf(transactionSet, movementRef(NEW_MOVEMENT_ID)),
    ).toMatchObject({
      type: "income",
      amount: 10,
      ownerId: "user-c",
      groupSettlementId: NEW_SETTLEMENT_ID,
      concept: "Dinner",
      deletedAt: null,
    });
    expect(
      lastWriteOf(transactionSet, movementRef(NEW_MOVEMENT_ID)),
    ).not.toHaveProperty("settlementId");
    expect(
      lastWriteOf(transactionSet, settlementRef(NEW_SETTLEMENT_ID)),
    ).toMatchObject({
      receiverWalletId: WALLET_ID,
      receiverTransactionId: NEW_MOVEMENT_ID,
    });
  });

  it("stores the stable concept token when the note is empty", async () => {
    transactionGet.mockResolvedValue(snapshot(WALLET_ID, walletDocument()));

    await run({ ...creditorLink, note: "   " });

    expect(
      lastWriteOf(transactionSet, movementRef(NEW_MOVEMENT_ID)),
    ).toMatchObject({ concept: "settlement" });
  });

  it("rejects a foreign, missing, archived or mismatched wallet", async () => {
    transactionGet.mockResolvedValue(
      snapshot(WALLET_ID, walletDocument({ ownerId: "user-a" })),
    );
    await expect(run(creditorLink)).rejects.toMatchObject({
      code: "WALLET_NOT_OWNED",
    });

    transactionGet.mockResolvedValue(missingSnapshot(WALLET_ID));
    await expect(run(creditorLink)).rejects.toMatchObject({
      code: "WALLET_NOT_FOUND",
    });

    transactionGet.mockResolvedValue(
      snapshot(WALLET_ID, walletDocument({ archivedAt: "2026-11-01" })),
    );
    await expect(run(creditorLink)).rejects.toMatchObject({
      code: "WALLET_ARCHIVED",
    });

    transactionGet.mockResolvedValue(
      snapshot(WALLET_ID, walletDocument({ currency: "USD" })),
    );
    await expect(run(creditorLink)).rejects.toMatchObject({
      code: "CURRENCY_MISMATCH",
    });

    expect(transactionSet).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("rejects a wallet without category before opening the transaction", async () => {
    await expect(
      run({ receiverWalletId: WALLET_ID, receiverCategoryId: null }),
    ).rejects.toMatchObject({ code: "CATEGORY_REQUIRED" });

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });
});
