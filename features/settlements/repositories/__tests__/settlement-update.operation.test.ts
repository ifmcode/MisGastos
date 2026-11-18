import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module under test.
import {
  MOVEMENT_ID,
  NOW,
  OTHER_WALLET_ID,
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
import { updateSettlementOperation } from "../settlement-update.operation";
import type { UpdateSettlementDto } from "../../types/settlement.types";
import { buildSettlementUpdateDto } from "./settlement-document.fixtures";

beforeEach(setupSettlementRepositoryMocks);

const NOTIFICATION_ID = `settlement-1:updated:user-b:${NOW}`;
const notification = {
  userId: "user-b",
  type: "settlement-updated" as const,
  payload: { settlementId: SETTLEMENT_ID, amountCents: 1000 },
  dedupeKey: NOTIFICATION_ID,
  createdAt: NOW,
};

const linkedStored = settlementDocument({
  receiverWalletId: WALLET_ID,
  receiverCategoryId: "category-1",
  receiverTransactionId: MOVEMENT_ID,
});

/** Queues the reads in the operation order: settlement, source, notification, wallets. */
function run(
  update: Partial<UpdateSettlementDto> = {},
  viewerUid = "user-b",
  stored: Record<string, unknown> = linkedStored,
  after: unknown[] = [],
) {
  transactionGet.mockResolvedValueOnce(snapshot(SETTLEMENT_ID, stored));
  for (const value of after) transactionGet.mockResolvedValueOnce(value);

  const dto = buildSettlementUpdateDto({
    receiverWalletId: stored.receiverWalletId as string | null,
    receiverCategoryId: stored.receiverCategoryId as string | null,
    ...update,
    updatedAt: NOW,
  });

  return updateSettlementOperation(
    {
      viewerUid,
      settlementId: SETTLEMENT_ID,
      update: dto,
      notification,
    },
    undefined as never,
  );
}

describe("updateSettlementOperation - creditor links", () => {
  it("keeps the balance when amount and wallet do not change", async () => {
    await run({ amountCents: 1000, date: "2026-11-12", note: "Lunch" }, "user-b", linkedStored, [
      snapshot(MOVEMENT_ID, movementDocument()),
      missingSnapshot(),
    ]);

    expect(transactionGet).toHaveBeenCalledTimes(3);
    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toBeUndefined();
    expect(lastWriteOf(transactionUpdate, movementRef(MOVEMENT_ID))).toMatchObject({
      amount: 10,
      date: "2026-11-12",
      concept: "Lunch",
      deletedAt: null,
    });
  });

  it("reverts and re-applies the amount in the same wallet", async () => {
    await run({ amountCents: 2000 }, "user-b", linkedStored, [
      snapshot(MOVEMENT_ID, movementDocument()),
      missingSnapshot(),
      snapshot(WALLET_ID, walletDocument({ balance: 110 })),
    ]);

    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toMatchObject({
      balance: 120,
    });
    expect(lastWriteOf(transactionUpdate, movementRef(MOVEMENT_ID))).toMatchObject({
      amount: 20,
    });
    expect(lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID))).toMatchObject({
      amountCents: 2000,
      receiverTransactionId: MOVEMENT_ID,
    });
  });

  it("moves the income to another wallet exactly once", async () => {
    await run(
      { amountCents: 1000, receiverWalletId: OTHER_WALLET_ID },
      "user-b",
      linkedStored,
      [
        snapshot(MOVEMENT_ID, movementDocument()),
        missingSnapshot(),
        snapshot(WALLET_ID, walletDocument({ balance: 110 })),
        snapshot(OTHER_WALLET_ID, walletDocument({ balance: 50 })),
      ],
    );

    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toMatchObject({
      balance: 100,
    });
    expect(lastWriteOf(transactionUpdate, walletRef(OTHER_WALLET_ID))).toMatchObject({
      balance: 60,
    });
    expect(lastWriteOf(transactionUpdate, movementRef(MOVEMENT_ID))).toMatchObject({
      walletId: OTHER_WALLET_ID,
    });
  });

  it("unlinks the wallet, reverts the income and soft-deletes the movement", async () => {
    await run({ receiverWalletId: null, receiverCategoryId: null }, "user-b", linkedStored, [
      snapshot(MOVEMENT_ID, movementDocument()),
      missingSnapshot(),
      snapshot(WALLET_ID, walletDocument({ balance: 110 })),
    ]);

    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toMatchObject({
      balance: 100,
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

  it("unlinks an archived wallet so the income can still be reverted", async () => {
    await run({ receiverWalletId: null, receiverCategoryId: null }, "user-b", linkedStored, [
      snapshot(MOVEMENT_ID, movementDocument()),
      missingSnapshot(),
      snapshot(WALLET_ID, walletDocument({ balance: 110, archivedAt: NOW })),
    ]);

    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toMatchObject({
      balance: 100,
    });
    expect(lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID))).toMatchObject({
      receiverWalletId: null,
      receiverTransactionId: null,
    });
  });

  it("links a wallet later from a social-only settlement", async () => {
    await run(
      {
        amountCents: 1000,
        receiverWalletId: WALLET_ID,
        receiverCategoryId: "category-1",
      },
      "user-b",
      settlementDocument(),
      [missingSnapshot(), snapshot(WALLET_ID, walletDocument({ balance: 100 }))],
    );

    expect(lastWriteOf(transactionUpdate, walletRef(WALLET_ID))).toMatchObject({
      balance: 110,
    });
    expect(lastWriteOf(transactionSet, movementRef("movement-new"))).toMatchObject({
      type: "income",
      settlementId: SETTLEMENT_ID,
      ownerId: "user-b",
      amount: 10,
    });
    expect(lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID))).toMatchObject({
      receiverWalletId: WALLET_ID,
      receiverTransactionId: "movement-new",
    });
  });

  it("skips the wallet when the previous one was permanently deleted", async () => {
    await run(
      { receiverWalletId: null, receiverCategoryId: null },
      "user-b",
      settlementDocument({
        receiverWalletId: "-1",
        receiverCategoryId: "category-1",
        receiverTransactionId: MOVEMENT_ID,
      }),
      [snapshot(MOVEMENT_ID, movementDocument({ walletId: "-1" })), missingSnapshot()],
    );

    expect(lastWriteOf(transactionUpdate, walletRef("-1"))).toBeUndefined();
    expect(lastWriteOf(transactionUpdate, movementRef(MOVEMENT_ID))).toMatchObject({
      deletedAt: NOW,
    });
  });

  it("moves the income to a new wallet when the previous one was deleted", async () => {
    await run(
      {
        amountCents: 1000,
        receiverWalletId: OTHER_WALLET_ID,
        receiverCategoryId: "category-1",
      },
      "user-b",
      settlementDocument({
        receiverWalletId: "-1",
        receiverCategoryId: "category-1",
        receiverTransactionId: MOVEMENT_ID,
      }),
      [
        snapshot(MOVEMENT_ID, movementDocument({ walletId: "-1" })),
        missingSnapshot(),
        snapshot(OTHER_WALLET_ID, walletDocument({ balance: 50 })),
      ],
    );

    expect(lastWriteOf(transactionUpdate, walletRef("-1"))).toBeUndefined();
    expect(lastWriteOf(transactionUpdate, walletRef(OTHER_WALLET_ID))).toMatchObject({
      balance: 60,
    });
    expect(lastWriteOf(transactionUpdate, movementRef(MOVEMENT_ID))).toMatchObject({
      walletId: OTHER_WALLET_ID,
      deletedAt: null,
    });
  });
});

describe("updateSettlementOperation - debtor and guards", () => {
  it("lets the debtor edit the date and the note without touching the movement", async () => {
    await run({ amountCents: 1000, date: "2026-11-13", note: "Thanks" }, "user-a", linkedStored, [
      missingSnapshot(),
    ]);

    expect(lastWriteOf(transactionUpdate, movementRef(MOVEMENT_ID))).toBeUndefined();
    expect(lastWriteOf(transactionUpdate, settlementRef(SETTLEMENT_ID))).toMatchObject({
      date: "2026-11-13",
      note: "Thanks",
      receiverWalletId: WALLET_ID,
      receiverTransactionId: MOVEMENT_ID,
    });
  });

  it("locks the amount for the debtor once a movement exists", async () => {
    await expect(run({ amountCents: 2000 }, "user-a")).rejects.toMatchObject({
      code: "AMOUNT_LOCKED",
    });

    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects a debtor link change", async () => {
    await expect(
      run(
        {
          receiverWalletId: OTHER_WALLET_ID,
          receiverCategoryId: "category-1",
        },
        "user-a",
        settlementDocument(),
      ),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
  });

  it("rejects an already deleted settlement", async () => {
    await expect(
      run({}, "user-b", settlementDocument({ deletedAt: "2026-11-15" })),
    ).rejects.toMatchObject({ code: "ALREADY_DELETED" });
  });

  it("rejects a missing settlement", async () => {
    transactionGet.mockResolvedValueOnce(missingSnapshot());

    await expect(
      updateSettlementOperation(
        {
          viewerUid: "user-b",
          settlementId: SETTLEMENT_ID,
          update: buildSettlementUpdateDto({ updatedAt: NOW }),
          notification,
        },
        undefined as never,
      ),
    ).rejects.toMatchObject({ code: "SETTLEMENT_NOT_FOUND" });
  });

  it("skips the notification when it already exists", async () => {
    await run({ amountCents: 1000 }, "user-b", linkedStored, [
      snapshot(MOVEMENT_ID, movementDocument()),
      snapshot(NOTIFICATION_ID, { userId: "user-b" }),
    ]);

    expect(lastWriteOf(transactionSet, notificationRef(NOTIFICATION_ID))).toBeUndefined();
  });
});
