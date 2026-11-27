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
import { softDeleteGroupSettlementOperation } from "../group-settlement-delete.operation";
import { buildGroupSettlementNotification } from "@/features/groups/repositories/group-notification.port";

beforeEach(setupGroupSettlementMocks);

const DELETED_AT = "2026-11-21T10:00:00.000Z";

function buildNotification(actorUid: string, recipientUid: string) {
  return buildGroupSettlementNotification({
    settlementId: SETTLEMENT_ID,
    groupId: "user-a__group-1",
    groupName: "Viaje",
    recipientUid,
    actorUid,
    event: "deleted",
    amountCents: 1000,
    currency: "EUR",
    notifiedAt: DELETED_AT,
  });
}

const storedLink = {
  receiverWalletId: WALLET_ID,
  receiverCategoryId: "category-1",
  receiverTransactionId: MOVEMENT_ID,
};

function run(viewerUid: string) {
  const recipient = viewerUid === "user-c" ? "user-b" : "user-c";

  return softDeleteGroupSettlementOperation({
    viewerUid,
    settlementId: SETTLEMENT_ID,
    deletedAt: DELETED_AT,
    notification: buildNotification(viewerUid, recipient),
  });
}

describe("softDeleteGroupSettlementOperation", () => {
  it("reverts the creditor income once and clears the link", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(SETTLEMENT_ID, groupSettlementDocument(storedLink)))
      .mockResolvedValueOnce(snapshot(MOVEMENT_ID, movementDocument()))
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 100 })));

    await run("user-c");

    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toMatchObject({
      balance: 90,
      updatedAt: DELETED_AT,
    });
    expect(lastWriteOf(transactionUpdate, movementRef(MOVEMENT_ID))).toMatchObject({
      deletedAt: DELETED_AT,
    });
    expect(
      lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID)),
    ).toEqual({
      deletedAt: DELETED_AT,
      updatedAt: DELETED_AT,
      receiverWalletId: null,
      receiverCategoryId: null,
      receiverTransactionId: null,
      revision: 1,
    });
    expect(
      notificationWriteOf(notificationRef(buildNotification("user-c", "user-b").dedupeKey)),
    ).toBeDefined();
    expect(lastWriteOf(transactionSet, activityRef("activity-new"))).toMatchObject({
      type: "settlement-deleted",
      actorId: "user-c",
      settlementId: SETTLEMENT_ID,
      fromUserId: "user-b",
      toUserId: "user-c",
      amountCents: 1000,
      description: "Dinner",
      createdAt: DELETED_AT,
    });
  });

  it("lets the debtor delete a social-only settlement", async () => {
    transactionGet.mockResolvedValue(
      snapshot(SETTLEMENT_ID, groupSettlementDocument()),
    );

    await run("user-b");

    expect(transactionUpdate).toHaveBeenCalledTimes(1);
    expect(lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID))).toEqual({
      deletedAt: DELETED_AT,
      updatedAt: DELETED_AT,
      revision: 1,
    });
  });

  it("blocks a debtor delete while the creditor income exists", async () => {
    transactionGet.mockResolvedValue(
      snapshot(SETTLEMENT_ID, groupSettlementDocument(storedLink)),
    );

    await expect(run("user-b")).rejects.toMatchObject({
      code: "SETTLEMENT_HAS_RECEIVER_MOVEMENT",
    });
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("is idempotent: a second delete writes nothing", async () => {
    transactionGet.mockResolvedValue(
      snapshot(
        SETTLEMENT_ID,
        groupSettlementDocument({ deletedAt: "2026-11-19T10:00:00.000Z" }),
      ),
    );

    await expect(run("user-c")).resolves.toBeUndefined();
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(transactionSet).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("rejects a missing settlement", async () => {
    transactionGet.mockResolvedValue(missingSnapshot(SETTLEMENT_ID));

    await expect(run("user-c")).rejects.toMatchObject({
      code: "SETTLEMENT_NOT_FOUND",
    });
  });
});
