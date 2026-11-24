import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module under test.
import {
  MOVEMENT_ID,
  NOW,
  SETTLEMENT_ID,
  WALLET_ID,
  groupSettlementDocument,
  activityRef,
  lastWriteOf,
  missingSnapshot,
  mockGetDoc,
  mockRunTransaction,
  mockSetDoc,
  movementDocument,
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
import { updateGroupSettlementOperation } from "../group-settlement-update.operation";
import { buildGroupSettlementNotification } from "@/features/groups/repositories/group-notification.port";

beforeEach(setupGroupSettlementMocks);

const notification = buildGroupSettlementNotification({
  settlementId: SETTLEMENT_ID,
  groupId: "user-a__group-1",
  groupName: "Viaje",
  recipientUid: "user-b",
  actorUid: "user-c",
  event: "updated",
  amountCents: 1000,
  currency: "EUR",
  notifiedAt: NOW,
});

const NOTIFICATION_ID = notification.dedupeKey;

function buildUpdate(overrides: Record<string, unknown> = {}) {
  return {
    amountCents: 1000,
    date: "2026-11-12",
    note: "Bank transfer",
    updatedAt: NOW,
    receiverWalletId: null,
    receiverCategoryId: null,
    ...overrides,
  };
}

function run(viewerUid: string, overrides: Record<string, unknown> = {}) {
  return updateGroupSettlementOperation({
    viewerUid,
    settlementId: SETTLEMENT_ID,
    update: buildUpdate(overrides),
    notification,
  });
}

const storedLink = {
  receiverWalletId: WALLET_ID,
  receiverCategoryId: "category-1",
  receiverTransactionId: MOVEMENT_ID,
};

describe("updateGroupSettlementOperation - debtor edit", () => {
  it("updates date and note without touching the creditor wallet", async () => {
    transactionGet.mockResolvedValue(
      snapshot(SETTLEMENT_ID, groupSettlementDocument()),
    );

    const updated = await run("user-b");

    expect(updated).toMatchObject({
      id: SETTLEMENT_ID,
      date: "2026-11-12",
      note: "Bank transfer",
    });
    expect(lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID))).toEqual(
      expect.objectContaining({
        amountCents: 1000,
        date: "2026-11-12",
        note: "Bank transfer",
        receiverWalletId: null,
      }),
    );
    expect(transactionUpdate).toHaveBeenCalledTimes(1);
    expect(lastWriteOf(transactionSet, activityRef("activity-new"))).toMatchObject({
      type: "settlement-updated",
      actorId: "user-b",
      settlementId: SETTLEMENT_ID,
      fromUserId: "user-b",
      toUserId: "user-c",
      amountCents: 1000,
      description: "Bank transfer",
    });
    expect(notificationWriteOf(notificationRef(NOTIFICATION_ID))).toBeDefined();
  });

  it("rejects a debtor that clears the creditor link", async () => {
    transactionGet.mockResolvedValue(
      snapshot(SETTLEMENT_ID, groupSettlementDocument(storedLink)),
    );

    await expect(run("user-b", { receiverWalletId: null })).rejects.toMatchObject(
      { code: "WALLET_NOT_OWNED" },
    );
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("locks the amount once the creditor income exists", async () => {
    transactionGet.mockResolvedValue(
      snapshot(SETTLEMENT_ID, groupSettlementDocument(storedLink)),
    );

    await expect(
      run("user-b", {
        amountCents: 2000,
        receiverWalletId: WALLET_ID,
        receiverCategoryId: "category-1",
      }),
    ).rejects.toMatchObject({ code: "AMOUNT_LOCKED" });
  });

  it("rejects an already deleted settlement", async () => {
    transactionGet.mockResolvedValue(
      snapshot(
        SETTLEMENT_ID,
        groupSettlementDocument({ deletedAt: "2026-11-15T10:00:00.000Z" }),
      ),
    );

    await expect(run("user-b")).rejects.toMatchObject({
      code: "ALREADY_DELETED",
    });
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("rejects a missing settlement", async () => {
    transactionGet.mockResolvedValue(missingSnapshot(SETTLEMENT_ID));

    await expect(run("user-b")).rejects.toMatchObject({
      code: "SETTLEMENT_NOT_FOUND",
    });
  });
});

describe("updateGroupSettlementOperation - creditor link", () => {
  it("reverts the previous income and applies the new amount once", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(SETTLEMENT_ID, groupSettlementDocument(storedLink)))
      .mockResolvedValueOnce(snapshot(MOVEMENT_ID, movementDocument()))
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 100 })));

    await run("user-c", {
      amountCents: 2000,
      receiverWalletId: WALLET_ID,
      receiverCategoryId: "category-1",
    });

    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toMatchObject({
      balance: 110,
      updatedAt: NOW,
    });
    expect(transactionUpdate).toHaveBeenCalledTimes(3);
    expect(transactionUpdate.mock.calls.map((call) => call[0])).toEqual(
      expect.arrayContaining([walletRef(WALLET_ID), movementRef(MOVEMENT_ID)]),
    );
  });

  it("links a wallet for the first time and writes the movement", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(SETTLEMENT_ID, groupSettlementDocument()))
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 100 })));

    const updated = await run("user-c", {
      receiverWalletId: WALLET_ID,
      receiverCategoryId: "category-1",
    });

    expect(updated).toMatchObject({
      receiverWalletId: WALLET_ID,
      receiverTransactionId: "movement-new",
    });
    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toMatchObject({
      balance: 110,
    });
    expect(notificationWriteOf(notificationRef(NOTIFICATION_ID))).toBeDefined();
  });

  it("keeps the wallat untouched when the link and the amount do not change", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(SETTLEMENT_ID, groupSettlementDocument(storedLink)))
      .mockResolvedValueOnce(snapshot(MOVEMENT_ID, movementDocument()));

    await run("user-c", {
      receiverWalletId: WALLET_ID,
      receiverCategoryId: "category-1",
    });

    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toBeUndefined();
    expect(lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID))).toMatchObject({
      receiverWalletId: WALLET_ID,
      receiverTransactionId: MOVEMENT_ID,
    });
  });

  it("unlinks the income, clears the keys and soft-deletes the movement", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(SETTLEMENT_ID, groupSettlementDocument(storedLink)))
      .mockResolvedValueOnce(snapshot(MOVEMENT_ID, movementDocument()))
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 100 })));

    await run("user-c");

    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toMatchObject({
      balance: 90,
    });
    expect(lastWriteOf(transactionUpdate, movementRef(MOVEMENT_ID))).toMatchObject({
      deletedAt: NOW,
    });
    expect(lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID))).toMatchObject({
      receiverWalletId: null,
      receiverCategoryId: null,
      receiverTransactionId: null,
    });
  });

  it("skips the notification when the event already exists", async () => {
    transactionGet.mockResolvedValue(
      snapshot(SETTLEMENT_ID, groupSettlementDocument()),
    );
    mockGetDoc.mockResolvedValue(
      snapshot(NOTIFICATION_ID, { userId: "user-b" }),
    );

    await run("user-b");

    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
  });

  it("does nothing on the wallet when the creditor edits a social-only row", async () => {
    transactionGet.mockResolvedValue(
      snapshot(SETTLEMENT_ID, groupSettlementDocument()),
    );

    await run("user-c");

    expect(transactionUpdate).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).toHaveBeenCalledWith(
      settlementRef(SETTLEMENT_ID),
      expect.objectContaining({ receiverWalletId: null }),
    );
  });

  it("fails without returning a malformed record", async () => {
    transactionGet.mockResolvedValue(
      snapshot(SETTLEMENT_ID, groupSettlementDocument()),
    );

    await expect(run("user-b", { amountCents: 0 })).rejects.toMatchObject({
      code: "SETTLEMENT_NOT_FOUND",
    });
  });
});
