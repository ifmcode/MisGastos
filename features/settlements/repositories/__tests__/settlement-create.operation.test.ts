import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module under test.
import {
  NOW,
  SETTLEMENT_ID,
  WALLET_ID,
  lastWriteOf,
  missingSnapshot,
  mockRunTransaction,
  movementRef,
  notificationRef,
  setupSettlementRepositoryMocks,
  settlementRef,
  snapshot,
  transactionGet,
  transactionSet,
  transactionUpdate,
  walletDocument,
  walletRef,
} from "./settlements-repository.test-helpers";
import { createSettlementOperation } from "../settlement-create.operation";
import type {
  CreateSettlementDto,
  Settlement,
} from "../../types/settlement.types";
import { buildCreateSettlementDto } from "./settlement-document.fixtures";

beforeEach(setupSettlementRepositoryMocks);

const NEW_SETTLEMENT_ID = "settlement-new";
const NEW_MOVEMENT_ID = "movement-new";
const NOTIFICATION_ID = `${NEW_SETTLEMENT_ID}:created:user-b`;

function buildNotification(settlement: Settlement) {
  return {
    userId: "user-b",
    type: "settlement-created" as const,
    payload: {
      settlementId: settlement.id,
      pairId: settlement.pairId,
      friendUid: "user-a",
      amountCents: settlement.amountCents,
      currency: settlement.currency,
      isFull: false,
      canLinkWallet: true,
    },
    dedupeKey: `${settlement.id}:created:user-b`,
    createdAt: settlement.updatedAt,
  };
}

function run(dto: Partial<CreateSettlementDto> = {}) {
  return createSettlementOperation(
    buildCreateSettlementDto({ updatedAt: NOW, ...dto }),
    buildNotification,
  );
}

const creditorLink = {
  receiverWalletId: WALLET_ID,
  receiverCategoryId: "category-1",
};

const linkedDocument = {
  receiverWalletId: WALLET_ID,
  receiverCategoryId: "category-1",
  receiverTransactionId: NEW_MOVEMENT_ID,
};

describe("createSettlementOperation - social-only", () => {
  it("writes the settlement and its notification without touching a wallet", async () => {
    transactionGet.mockResolvedValue(missingSnapshot());

    const settlement = await run();

    expect(settlement).toMatchObject({
      id: NEW_SETTLEMENT_ID,
      amountCents: 1000,
      receiverTransactionId: null,
    });
    expect(lastWriteOf(transactionSet, settlementRef(NEW_SETTLEMENT_ID))).toEqual(
      expect.objectContaining({
        amountCents: 1000,
        receiverWalletId: null,
        receiverTransactionId: null,
      }),
    );
    expect(lastWriteOf(transactionSet, notificationRef(NOTIFICATION_ID))).toMatchObject(
      { userId: "user-b", type: "settlement-created" },
    );
    expect(lastWriteOf(transactionSet, movementRef(NEW_MOVEMENT_ID))).toBeUndefined();
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("skips the notification when its dedupe key already exists", async () => {
    transactionGet.mockResolvedValue(snapshot(NOTIFICATION_ID, { userId: "user-b" }));

    await run();

    expect(transactionSet).toHaveBeenCalledTimes(1);
    expect(lastWriteOf(transactionSet, settlementRef(NEW_SETTLEMENT_ID))).toBeDefined();
  });
});

describe("createSettlementOperation - creditor wallet", () => {
  it("applies the income, writes the movement and the wallet balance", async () => {
    transactionGet
      .mockResolvedValueOnce(missingSnapshot())
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 100 })));

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
    expect(lastWriteOf(transactionSet, movementRef(NEW_MOVEMENT_ID))).toMatchObject({
      type: "income",
      amount: 10,
      ownerId: "user-b",
      settlementId: NEW_SETTLEMENT_ID,
      concept: "Dinner",
      deletedAt: null,
    });
    expect(lastWriteOf(transactionSet, settlementRef(NEW_SETTLEMENT_ID))).toMatchObject(
      linkedDocument,
    );
  });

  it("stores the stable concept token when the note is empty", async () => {
    transactionGet
      .mockResolvedValueOnce(missingSnapshot())
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument()));

    await run({ ...creditorLink, note: "   " });

    expect(lastWriteOf(transactionSet, movementRef(NEW_MOVEMENT_ID))).toMatchObject({
      concept: "settlement",
    });
  });

  it("rejects a foreign, missing, archived or mismatched wallet", async () => {
    transactionGet
      .mockResolvedValueOnce(missingSnapshot())
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ ownerId: "user-a" })),
      );
    await expect(run(creditorLink)).rejects.toMatchObject({
      code: "WALLET_NOT_OWNED",
    });

    transactionGet
      .mockResolvedValueOnce(missingSnapshot())
      .mockResolvedValueOnce(missingSnapshot(WALLET_ID));
    await expect(run(creditorLink)).rejects.toMatchObject({
      code: "WALLET_NOT_FOUND",
    });

    transactionGet
      .mockResolvedValueOnce(missingSnapshot())
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ archivedAt: "2026-11-01" })),
      );
    await expect(run(creditorLink)).rejects.toMatchObject({
      code: "WALLET_ARCHIVED",
    });

    transactionGet
      .mockResolvedValueOnce(missingSnapshot())
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ currency: "USD" })),
      );
    await expect(run(creditorLink)).rejects.toMatchObject({
      code: "CURRENCY_MISMATCH",
    });

    expect(transactionSet).not.toHaveBeenCalled();
  });

  it("rejects a wallet without category before opening the transaction", async () => {
    await expect(
      run({ receiverWalletId: WALLET_ID, receiverCategoryId: null }),
    ).rejects.toMatchObject({ code: "CATEGORY_REQUIRED" });

    expect(mockRunTransaction).not.toHaveBeenCalled();
    expect(SETTLEMENT_ID).toBeDefined();
  });
});
