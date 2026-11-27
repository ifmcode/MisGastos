import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module under test.
import {
  MOVEMENT_ID,
  NOW,
  SETTLEMENT_ID,
  WALLET_ID,
  lastWriteOf,
  missingSnapshot,
  movementDocument,
  movementRef,
  notificationRef,
  settlementDocument,
  settlementRef,
  setupSettlementRepositoryMocks,
  snapshot,
  transactionGet,
  transactionSet,
  transactionUpdate,
  walletDocument,
  walletRef,
} from "./settlements-repository.test-helpers";
import { softDeleteSettlementOperation } from "../settlement-delete.operation";

beforeEach(setupSettlementRepositoryMocks);

const NOTIFICATION_ID = `settlement-1:deleted:user-b`;
const notification = {
  userId: "user-b",
  type: "settlement-deleted" as const,
  payload: { settlementId: SETTLEMENT_ID },
  dedupeKey: NOTIFICATION_ID,
  createdAt: NOW,
};

const linkedStored = settlementDocument({
  receiverWalletId: WALLET_ID,
  receiverCategoryId: "category-1",
  receiverTransactionId: MOVEMENT_ID,
});

/** Queues the reads in the operation order: settlement, source, notification, wallet. */
function run(
  viewerUid = "user-b",
  stored: Record<string, unknown> = linkedStored,
  after: unknown[] = [],
) {
  transactionGet.mockResolvedValueOnce(snapshot(SETTLEMENT_ID, stored));
  for (const value of after) transactionGet.mockResolvedValueOnce(value);

  return softDeleteSettlementOperation(
    {
      viewerUid,
      settlementId: SETTLEMENT_ID,
      deletedAt: NOW,
      notification,
    },
    undefined as never,
  );
}

describe("softDeleteSettlementOperation - creditor", () => {
  it("reverts the income once and clears the receiver link", async () => {
    await run("user-b", linkedStored, [
      snapshot(MOVEMENT_ID, movementDocument()),
      missingSnapshot(),
      snapshot(WALLET_ID, walletDocument({ balance: 110 })),
    ]);

    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toMatchObject({
      balance: 100,
    });
    expect(lastWriteOf(transactionUpdate, movementRef(MOVEMENT_ID))).toMatchObject({
      deletedAt: NOW,
      updatedAt: NOW,
    });
    expect(lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID))).toMatchObject({
      deletedAt: NOW,
      receiverWalletId: null,
      receiverCategoryId: null,
      receiverTransactionId: null,
    });
    expect(lastWriteOf(transactionSet, notificationRef(NOTIFICATION_ID))).toMatchObject({
      type: "settlement-deleted",
    });
  });

  it("soft-deletes a settlement without movement", async () => {
    await run("user-b", settlementDocument(), [missingSnapshot()]);

    expect(transactionUpdate).toHaveBeenCalledTimes(1);
    expect(lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID))).toMatchObject({
      deletedAt: NOW,
      receiverTransactionId: null,
    });
  });

  it("reverts the income from a wallet archived after the link", async () => {
    await run("user-b", linkedStored, [
      snapshot(MOVEMENT_ID, movementDocument()),
      missingSnapshot(),
      snapshot(WALLET_ID, walletDocument({ balance: 110, archivedAt: NOW })),
    ]);

    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toMatchObject({
      balance: 100,
    });
    expect(lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID))).toMatchObject({
      deletedAt: NOW,
      receiverWalletId: null,
      receiverTransactionId: null,
    });
  });

  it("rejects a movement owned by someone else", async () => {
    await expect(
      run("user-b", linkedStored, [
        snapshot(MOVEMENT_ID, movementDocument({ ownerId: "user-a" })),
        missingSnapshot(),
        snapshot(WALLET_ID, walletDocument()),
      ]),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });

    expect(transactionUpdate).not.toHaveBeenCalled();
  });
});

describe("softDeleteSettlementOperation - debtor and idempotency", () => {
  it("deletes a social-only settlement without touching the receiver keys", async () => {
    await run("user-a", settlementDocument(), [missingSnapshot()]);

    expect(lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID))).toEqual({
      deletedAt: NOW,
      updatedAt: NOW,
      revision: 1,
    });
  });

  it("blocks a debtor delete while the creditor movement exists", async () => {
    await expect(run("user-a")).rejects.toMatchObject({
      code: "SETTLEMENT_HAS_RECEIVER_MOVEMENT",
    });

    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("is idempotent for an already deleted settlement", async () => {
    await run("user-b", {
      ...linkedStored,
      deletedAt: "2026-11-15T10:00:00.000Z",
    });

    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(transactionSet).not.toHaveBeenCalled();
  });

  it("rejects a missing settlement", async () => {
    transactionGet.mockResolvedValueOnce(missingSnapshot());

    await expect(
      softDeleteSettlementOperation(
        {
          viewerUid: "user-b",
          settlementId: SETTLEMENT_ID,
          deletedAt: NOW,
          notification,
        },
        undefined as never,
      ),
    ).rejects.toMatchObject({ code: "SETTLEMENT_NOT_FOUND" });
  });

  it("skips the notification when it already exists", async () => {
    await run("user-b", settlementDocument(), [
      snapshot(NOTIFICATION_ID, { userId: "user-b" }),
    ]);

    expect(lastWriteOf(transactionSet, notificationRef(NOTIFICATION_ID))).toBeUndefined();
  });
});
