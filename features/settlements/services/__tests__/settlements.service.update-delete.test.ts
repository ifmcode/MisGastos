import { beforeEach, describe, expect, it } from "@jest/globals";

import type { FriendLedgerEntry } from "@/features/friends/types/friend.types";

import type { Settlement } from "../../types/settlement.types";
import { buildSettlement } from "../../repositories/__tests__/settlement-document.fixtures";
import { SettlementsService } from "../settlements.service";
import {
  FakeSettlementsRepository,
  fakeFriendsRepository,
  fakeLedgerRepository,
} from "./settlement-service.fakes";

let repository: FakeSettlementsRepository;

function expense(): FriendLedgerEntry {
  return {
    id: "expense-1",
    fromUserId: "user-a",
    toUserId: "user-b",
    amountCents: 1000,
    currency: "EUR",
    deletedAt: null,
  };
}

/** Reverse edge emitted by the settlement being edited. */
function settlementEntry(amountCents = 400): FriendLedgerEntry {
  return {
    id: "settlement:settlement-1",
    fromUserId: "user-b",
    toUserId: "user-a",
    amountCents,
    currency: "EUR",
    deletedAt: null,
  };
}

function buildService(stored: Settlement): SettlementsService {
  repository = new FakeSettlementsRepository();
  repository.settlements = [stored];

  return new SettlementsService(
    repository,
    fakeFriendsRepository(true),
    fakeLedgerRepository([expense(), settlementEntry()]),
  );
}

const input = {
  friendUid: "user-b",
  currency: "EUR",
  amount: "8,00",
  date: "2026-11-16",
  note: "Thanks",
};

const stored = buildSettlement({ id: "settlement-1", amountCents: 400 });

describe("updateSettlement - amount bound", () => {
  it("validates the amount against the debt excluding this settlement", async () => {
    const service = buildService(stored);

    await service.updateSettlement("user-a", "settlement-1", input);

    expect(repository.updates[0].update).toMatchObject({
      amountCents: 800,
      note: "Thanks",
      receiverWalletId: null,
      receiverCategoryId: null,
    });
    expect(repository.updates[0].notification).toMatchObject({
      userId: "user-b",
      type: "settlement-updated",
      payload: { amountCents: 800, canLinkWallet: true, isFull: false },
    });
  });

  it("rejects an amount above the debt that excludes this settlement", async () => {
    const service = buildService(stored);

    await expect(
      service.updateSettlement("user-a", "settlement-1", {
        ...input,
        amount: "10,01",
      }),
    ).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_DEBT" });
  });

  it("rejects an immutable currency change", async () => {
    const service = buildService(stored);

    await expect(
      service.updateSettlement("user-a", "settlement-1", {
        ...input,
        currency: "USD",
      }),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
  });
});

describe("updateSettlement - guards", () => {
  it("locks the amount for the debtor once the creditor linked a movement", async () => {
    const service = buildService(
      buildSettlement({
        id: "settlement-1",
        amountCents: 400,
        receiverWalletId: "wallet-1",
        receiverCategoryId: "category-1",
        receiverTransactionId: "movement-1",
      }),
    );

    await expect(
      service.updateSettlement("user-a", "settlement-1", input),
    ).rejects.toMatchObject({ code: "AMOUNT_LOCKED" });
  });

  it("lets the debtor edit date and note and preserves the creditor link", async () => {
    const service = buildService(
      buildSettlement({
        id: "settlement-1",
        amountCents: 400,
        receiverWalletId: "wallet-1",
        receiverCategoryId: "category-1",
        receiverTransactionId: "movement-1",
      }),
    );

    await service.updateSettlement("user-a", "settlement-1", {
      ...input,
      amount: "4,00",
    });

    expect(repository.updates[0].update).toMatchObject({
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
      date: "2026-11-16",
    });
  });

  it("rejects a debtor wallet link", async () => {
    const service = buildService(stored);

    await expect(
      service.updateSettlement("user-a", "settlement-1", {
        ...input,
        walletId: "wallet-1",
        categoryId: "category-1",
      }),
    ).rejects.toMatchObject({ fieldErrors: { walletId: "WALLET_NOT_OWNED" } });
  });

  it("rejects another friend, an outsider and a deleted record", async () => {
    const service = buildService(stored);

    await expect(
      service.updateSettlement("user-a", "settlement-1", {
        ...input,
        friendUid: "user-c",
      }),
    ).rejects.toMatchObject({ code: "NOT_PARTICIPANT" });
    await expect(
      service.updateSettlement("user-c", "settlement-1", input),
    ).rejects.toMatchObject({ code: "NOT_PARTICIPANT" });

    const deleted = buildService(
      buildSettlement({
        id: "settlement-1",
        deletedAt: "2026-11-15T10:00:00.000Z",
      }),
    );
    await expect(
      deleted.updateSettlement("user-a", "settlement-1", input),
    ).rejects.toMatchObject({ code: "ALREADY_DELETED" });
  });

  it("rejects an empty, missing or signed-out update", async () => {
    const service = buildService(stored);

    await expect(
      service.updateSettlement("user-a", "  ", input),
    ).rejects.toMatchObject({ code: "SETTLEMENT_NOT_FOUND" });
    await expect(
      service.updateSettlement("user-a", "missing", input),
    ).rejects.toMatchObject({ code: "SETTLEMENT_NOT_FOUND" });
    await expect(
      service.updateSettlement("", "settlement-1", input),
    ).rejects.toMatchObject({ code: "SIGN_IN_REQUIRED" });
  });
});

describe("deleteSettlement", () => {
  it("lets the creditor delete and notifies the debtor", async () => {
    const service = buildService(
      buildSettlement({
        id: "settlement-1",
        receiverWalletId: "wallet-1",
        receiverCategoryId: "category-1",
        receiverTransactionId: "movement-1",
      }),
    );

    await service.deleteSettlement("user-b", "settlement-1");

    expect(repository.deletes).toHaveLength(1);
    expect(repository.deletes[0].notification).toMatchObject({
      userId: "user-a",
      type: "settlement-deleted",
      payload: { isFull: false, canLinkWallet: false },
    });
  });

  it("lets the debtor delete a social-only settlement", async () => {
    const service = buildService(stored);

    await service.deleteSettlement("user-a", "settlement-1");

    expect(repository.deletes[0].notification.userId).toBe("user-b");
  });

  it("blocks the debtor while the creditor movement exists", async () => {
    const service = buildService(
      buildSettlement({
        id: "settlement-1",
        receiverWalletId: "wallet-1",
        receiverCategoryId: "category-1",
        receiverTransactionId: "movement-1",
      }),
    );

    await expect(
      service.deleteSettlement("user-a", "settlement-1"),
    ).rejects.toMatchObject({ code: "SETTLEMENT_HAS_RECEIVER_MOVEMENT" });
    expect(repository.deletes).toHaveLength(0);
  });

  it("is idempotent after a delete and rejects outsiders", async () => {
    const service = buildService(
      buildSettlement({
        id: "settlement-1",
        deletedAt: "2026-11-15T10:00:00.000Z",
      }),
    );

    await service.deleteSettlement("user-a", "settlement-1");

    expect(repository.deletes).toHaveLength(0);

    const active = buildService(stored);
    await expect(
      active.deleteSettlement("user-c", "settlement-1"),
    ).rejects.toMatchObject({ code: "NOT_PARTICIPANT" });
  });

  it("rejects an empty id or a signed-out viewer", async () => {
    const service = buildService(stored);

    await expect(
      service.deleteSettlement("user-a", "  "),
    ).rejects.toMatchObject({ code: "SETTLEMENT_NOT_FOUND" });
    await expect(service.deleteSettlement("", "settlement-1")).rejects.toMatchObject(
      { code: "SIGN_IN_REQUIRED" },
    );
    await expect(service.getSettlements("")).rejects.toMatchObject({
      code: "SIGN_IN_REQUIRED",
    });
  });
});
