import { describe, expect, it } from "@jest/globals";

import {
  buildExpense,
  buildGroup,
  buildGroupSettlement,
  buildSettlementInput,
  createDebtHarness,
  createHarness,
} from "./group-settlements-service.harness";

const LINK = { walletId: "wallet-1", categoryId: "category-1" };
const sharedLink = {
  receiverWalletId: "wallet-1",
  receiverCategoryId: "category-1",
  receiverTransactionId: "movement-1",
};

/**
 * `user-a` owes `user-b` 10 € and a recorded `user-a → user-c` payment 10 € makes
 * the simplified view route the remaining debt to `user-c`. Excluding that
 * settlement leaves an `a → b` suggestion, so the stored `a → c` pair is no
 * longer in the view.
 */
function reroutedHarness() {
  const harness = createHarness();
  harness.expenses.seed(
    buildExpense({
      id: "a-owes-b",
      payerId: "user-b",
      amountCents: 1000,
      participants: [
        { userId: "user-a", shareCents: 1000 },
        { userId: "user-b", shareCents: 0 },
      ],
    }),
  );
  harness.repository.seed(
    buildGroupSettlement({
      id: "to-c",
      participantIds: ["user-a", "user-c"],
      pairId: "user-a__user-c",
      fromUserId: "user-a",
      toUserId: "user-c",
      amountCents: 1000,
    }),
  );

  return harness;
}

function reroutedInput(overrides: Record<string, string> = {}) {
  return buildSettlementInput({
    fromUserId: "user-a",
    toUserId: "user-c",
    ...overrides,
  });
}

describe("GroupSettlementsService.updateGroupSettlement", () => {
  it("lets the debtor edit the date and the note", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(buildGroupSettlement());

    await service.updateGroupSettlement(
      "user-b",
      "group-settlement-1",
      buildSettlementInput({ amount: "10.00", date: "2026-11-12", note: "Cash" }),
    );

    const call = repository.updateCalls[0];
    expect(call).toMatchObject({
      viewerUid: "user-b",
      settlementId: "group-settlement-1",
      update: {
        amountCents: 1000,
        date: "2026-11-12",
        note: "Cash",
        receiverWalletId: null,
        receiverCategoryId: null,
      },
    });
    expect(call.notification).toMatchObject({
      userId: "user-c",
      type: "group-settlement",
    });
    expect(call.notification.dedupeKey).toContain(":updated:");
  });

  it("keeps the pair, the currency and the group immutable", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(buildGroupSettlement());

    await expect(
      service.updateGroupSettlement(
        "user-b",
        "group-settlement-1",
        buildSettlementInput({ fromUserId: "user-c", toUserId: "user-b" }),
      ),
    ).rejects.toMatchObject({ code: "DIRECTION_MISMATCH" });

    await expect(
      service.updateGroupSettlement(
        "user-b",
        "group-settlement-1",
        buildSettlementInput({ currency: "USD" }),
      ),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
  });

  it("rejects a missing, deleted or foreign settlement", async () => {
    const { repository, service } = createDebtHarness();

    await expect(
      service.updateGroupSettlement(
        "user-b",
        "missing",
        buildSettlementInput(),
      ),
    ).rejects.toMatchObject({ code: "SETTLEMENT_NOT_FOUND" });

    repository.seed(
      buildGroupSettlement({
        id: "deleted",
        deletedAt: "2026-11-12T10:00:00.000Z",
      }),
    );
    await expect(
      service.updateGroupSettlement("user-b", "deleted", buildSettlementInput()),
    ).rejects.toMatchObject({ code: "ALREADY_DELETED" });

    repository.seed(buildGroupSettlement());
    await expect(
      service.updateGroupSettlement("user-a", "group-settlement-1", buildSettlementInput()),
    ).rejects.toMatchObject({ code: "NOT_SETTLEMENT_PARTICIPANT" });

    await expect(
      service.updateGroupSettlement("user-b", "  ", buildSettlementInput()),
    ).rejects.toMatchObject({ code: "SETTLEMENT_NOT_FOUND" });
  });

  it("lets only the creditor own the receiver link", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(buildGroupSettlement());

    await expect(
      service.updateGroupSettlement(
        "user-b",
        "group-settlement-1",
        buildSettlementInput(LINK),
      ),
    ).rejects.toMatchObject({
      fieldErrors: { walletId: "WALLET_NOT_OWNED" },
    });

    await service.updateGroupSettlement(
      "user-c",
      "group-settlement-1",
      buildSettlementInput(LINK),
    );
    expect(repository.updateCalls[0].update).toMatchObject({
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
    });
  });

  it("locks the amount once the creditor income exists", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(buildGroupSettlement(sharedLink));

    await expect(
      service.updateGroupSettlement(
        "user-b",
        "group-settlement-1",
        buildSettlementInput({ amount: "5.00" }),
      ),
    ).rejects.toMatchObject({ code: "AMOUNT_LOCKED" });
  });

  it("bounds the amount against the debt without the edited settlement", async () => {
    const exact = createDebtHarness();
    exact.repository.seed(buildGroupSettlement());
    await expect(
      exact.service.updateGroupSettlement(
        "user-b",
        "group-settlement-1",
        buildSettlementInput({ amount: "10.00" }),
      ),
    ).resolves.toBeDefined();

    const over = createDebtHarness();
    over.repository.seed(buildGroupSettlement());
    await expect(
      over.service.updateGroupSettlement(
        "user-b",
        "group-settlement-1",
        buildSettlementInput({ amount: "10.01" }),
      ),
    ).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_DEBT" });
  });

  it("rejects an edit whose group is gone", async () => {
    const { repository, service } = createHarness();
    repository.seed(buildGroupSettlement({ groupId: "user-a__missing" }));

    await expect(
      service.updateGroupSettlement(
        "user-b",
        "group-settlement-1",
        buildSettlementInput({ groupId: "user-a__missing" }),
      ),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });

  it("edits the note when the pair leaves the simplified view", async () => {
    const { repository, service } = reroutedHarness();

    await service.updateGroupSettlement(
      "user-a",
      "to-c",
      reroutedInput({ note: "Bank transfer" }),
    );

    expect(repository.updateCalls[0].update).toMatchObject({
      amountCents: 1000,
      note: "Bank transfer",
    });
  });

  it("lowers the amount up to the stored amount when the pair left the view", async () => {
    const lowered = reroutedHarness();
    await expect(
      lowered.service.updateGroupSettlement(
        "user-a",
        "to-c",
        reroutedInput({ amount: "4.00" }),
      ),
    ).resolves.toBeDefined();
    expect(lowered.repository.updateCalls[0].update).toMatchObject({
      amountCents: 400,
    });

    const kept = reroutedHarness();
    await expect(
      kept.service.updateGroupSettlement("user-a", "to-c", reroutedInput()),
    ).resolves.toBeDefined();
  });

  it("rejects an increase above the stored amount when the pair left the view", async () => {
    const { repository, service } = reroutedHarness();

    await expect(
      service.updateGroupSettlement(
        "user-a",
        "to-c",
        reroutedInput({ amount: "10.01" }),
      ),
    ).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_DEBT" });
    expect(repository.updateCalls).toEqual([]);
  });

  it("keeps a stored pair editable when its debt row runs the other way", async () => {
    const harness = createHarness();
    harness.groups.seedGroup(buildGroup({ simplifyDebts: false }));
    // C owes A, but the stored settlement says A paid C.
    harness.expenses.seed(
      buildExpense({
        id: "c-owes-a",
        payerId: "user-a",
        amountCents: 1000,
        participants: [
          { userId: "user-a", shareCents: 0 },
          { userId: "user-c", shareCents: 1000 },
        ],
      }),
    );
    harness.repository.seed(
      buildGroupSettlement({
        id: "to-c",
        participantIds: ["user-a", "user-c"],
        pairId: "user-a__user-c",
        fromUserId: "user-a",
        toUserId: "user-c",
        amountCents: 1000,
      }),
    );

    await expect(
      harness.service.updateGroupSettlement(
        "user-a",
        "to-c",
        reroutedInput({ note: "Historical note" }),
      ),
    ).resolves.toBeDefined();
    expect(harness.repository.updateCalls[0].update).toMatchObject({
      amountCents: 1000,
      note: "Historical note",
    });

    await expect(
      harness.service.updateGroupSettlement(
        "user-a",
        "to-c",
        reroutedInput({ amount: "10.01" }),
      ),
    ).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_DEBT" });
  });
});

describe("GroupSettlementsService.deleteGroupSettlement", () => {
  it("soft-deletes and notifies the other member of the pair", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(buildGroupSettlement());

    await service.deleteGroupSettlement("user-b", "group-settlement-1");

    const call = repository.deleteCalls[0];
    expect(call).toMatchObject({
      viewerUid: "user-b",
      settlementId: "group-settlement-1",
    });
    expect(call.notification).toMatchObject({
      userId: "user-c",
      type: "group-settlement",
      payload: { settlementId: "group-settlement-1", friendUid: "user-b" },
    });
    expect(call.notification.dedupeKey).toContain(":deleted:");
  });

  it("lets the creditor delete a settlement with a linked income", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(buildGroupSettlement(sharedLink));

    await service.deleteGroupSettlement("user-c", "group-settlement-1");

    expect(repository.deleteCalls).toHaveLength(1);
  });

  it("blocks the debtor while the creditor income exists", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(buildGroupSettlement(sharedLink));

    await expect(
      service.deleteGroupSettlement("user-b", "group-settlement-1"),
    ).rejects.toMatchObject({ code: "SETTLEMENT_HAS_RECEIVER_MOVEMENT" });
  });

  it("is idempotent for an already deleted settlement", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(
      buildGroupSettlement({ deletedAt: "2026-11-12T10:00:00.000Z" }),
    );

    await expect(
      service.deleteGroupSettlement("user-b", "group-settlement-1"),
    ).resolves.toBeUndefined();
    expect(repository.deleteCalls).toEqual([]);
  });

  it("rejects a foreign settlement, a missing one and an empty id", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(buildGroupSettlement());

    await expect(
      service.deleteGroupSettlement("user-a", "group-settlement-1"),
    ).rejects.toMatchObject({ code: "NOT_SETTLEMENT_PARTICIPANT" });
    await expect(
      service.deleteGroupSettlement("user-b", "missing"),
    ).rejects.toMatchObject({ code: "SETTLEMENT_NOT_FOUND" });
    await expect(
      service.deleteGroupSettlement("user-b", ""),
    ).rejects.toMatchObject({ code: "SETTLEMENT_NOT_FOUND" });
  });
});
