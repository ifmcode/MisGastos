import { describe, expect, it } from "@jest/globals";

import { GroupExpenseValidationError } from "../group-expense.errors";
import { GroupSettlementValidationError } from "../group-settlement.errors";
import {
  GROUP_ID,
  buildExpense,
  buildGroup,
  buildGroupSettlement,
  buildSettlementInput,
  createDebtHarness,
  createHarness,
} from "./group-settlements-service.harness";

/** A owes B 10 and B owes C 10: simplified to A→C, never a direct row. */
function chainedDebtHarness(simplifyDebts: boolean) {
  const harness = createHarness();
  harness.groups.seedGroup(buildGroup({ simplifyDebts }));
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
  harness.expenses.seed(
    buildExpense({
      id: "b-owes-c",
      payerId: "user-c",
      amountCents: 1000,
      participants: [
        { userId: "user-b", shareCents: 1000 },
        { userId: "user-c", shareCents: 0 },
      ],
    }),
  );

  return harness;
}

describe("GroupSettlementsService.createGroupSettlement", () => {
  it("records the payment the stored pair debt describes", async () => {
    const { repository, service } = createDebtHarness();

    const settlement = await service.createGroupSettlement(
      "user-b",
      buildSettlementInput(),
    );

    const { dto, notification } = repository.createCalls[0];
    expect(dto).toEqual({
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
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
      receiverWalletId: null,
      receiverCategoryId: null,
      receiverTransactionId: null,
    });
    expect(dto.createdAt).toBe(dto.updatedAt);
    expect(settlement.id).toBe("created-settlement-1");
    expect(notification).toMatchObject({
      userId: "user-c",
      type: "group-settlement",
      payload: {
        settlementId: "created-settlement-1",
        groupId: GROUP_ID,
        groupName: "Viaje",
        friendUid: "user-b",
        amountCents: 1000,
        currency: "EUR",
      },
    });
    expect(notification.dedupeKey).toContain(":created:");
  });

  it("lets the creditor record the same payment from their side", async () => {
    const { repository, service } = createDebtHarness();

    await service.createGroupSettlement("user-c", buildSettlementInput());

    expect(repository.createCalls[0].dto).toMatchObject({
      fromUserId: "user-b",
      toUserId: "user-c",
      createdBy: "user-c",
    });
    expect(repository.createCalls[0].notification.userId).toBe("user-b");
  });

  it("trims the viewer before it stamps createdBy", async () => {
    const { repository, service } = createDebtHarness();

    await service.createGroupSettlement(" user-b ", buildSettlementInput());

    expect(repository.createCalls[0].dto.createdBy).toBe("user-b");
  });

  it("rejects a viewer outside the pair", async () => {
    const { repository, service } = createDebtHarness();

    await expect(
      service.createGroupSettlement(
        "user-a",
        buildSettlementInput({ amount: "5.00" }),
      ),
    ).rejects.toMatchObject({ code: "NOT_SETTLEMENT_PARTICIPANT" });
    expect(repository.createCalls).toEqual([]);
  });

  it("rejects the opposite direction of the stored debt", async () => {
    const { service } = createDebtHarness();

    await expect(
      service.createGroupSettlement(
        "user-b",
        buildSettlementInput({ fromUserId: "user-c", toUserId: "user-b" }),
      ),
    ).rejects.toMatchObject({ code: "DIRECTION_MISMATCH" });
  });

  it("rejects a pair whose debt runs the other way", async () => {
    const harness = createHarness();
    // `user-c` owes `user-b`: the stored pair row exists, but flipped.
    harness.expenses.seed(
      buildExpense({
        payerId: "user-b",
        amountCents: 1000,
        participants: [
          { userId: "user-b", shareCents: 0 },
          { userId: "user-c", shareCents: 1000 },
        ],
      }),
    );

    await expect(
      harness.service.createGroupSettlement("user-b", buildSettlementInput()),
    ).rejects.toMatchObject({ code: "DIRECTION_MISMATCH" });

    await expect(
      harness.service.createGroupSettlement(
        "user-b",
        buildSettlementInput({ fromUserId: "user-c", toUserId: "user-b" }),
      ),
    ).resolves.toBeDefined();
  });

  it("rejects a settled pair and an amount above the debt", async () => {
    const settled = createHarness();
    await expect(
      settled.service.createGroupSettlement("user-b", buildSettlementInput()),
    ).rejects.toMatchObject({ code: "NO_DEBT" });

    const { service } = createDebtHarness();
    await expect(
      service.createGroupSettlement(
        "user-b",
        buildSettlementInput({ amount: "10.01" }),
      ),
    ).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_DEBT" });

    await expect(
      service.createGroupSettlement(
        "user-b",
        buildSettlementInput({ amount: "5.00" }),
      ),
    ).resolves.toBeDefined();
  });

  it("ignores soft-deleted settlements when it bounds the amount", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(buildGroupSettlement({ deletedAt: "2026-11-12T10:00:00.000Z" }));

    await expect(
      service.createGroupSettlement("user-b", buildSettlementInput()),
    ).resolves.toBeDefined();
  });

  it("rejects a pair member that is not an active group member", async () => {
    const { service } = createDebtHarness();

    await expect(
      service.createGroupSettlement(
        "user-b",
        buildSettlementInput({ toUserId: "user-z" }),
      ),
    ).rejects.toMatchObject({ code: "NOT_GROUP_MEMBER" });
  });

  it("rejects a viewer that is not a member of the group", async () => {
    const { service } = createDebtHarness();

    await expect(
      service.createGroupSettlement(
        "user-z",
        buildSettlementInput({ fromUserId: "user-z", toUserId: "user-c" }),
      ),
    ).rejects.toMatchObject({ code: "NOT_GROUP_MEMBER" });
  });

  it("rejects an unknown group and an anonymous viewer", async () => {
    const { service } = createDebtHarness();

    await expect(
      service.createGroupSettlement(
        "user-b",
        buildSettlementInput({ groupId: "user-a__missing" }),
      ),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });

    await expect(
      service.createGroupSettlement("  ", buildSettlementInput()),
    ).rejects.toMatchObject({ code: "SIGN_IN_REQUIRED" });
  });

  it("lets only the creditor link a wallet", async () => {
    const { repository, service } = createDebtHarness();
    const link = { walletId: "wallet-1", categoryId: "category-1" };

    await expect(
      service.createGroupSettlement("user-b", buildSettlementInput(link)),
    ).rejects.toMatchObject({
      fieldErrors: { walletId: "WALLET_NOT_OWNED" },
    });
    expect(repository.createCalls).toEqual([]);

    await service.createGroupSettlement(
      "user-c",
      buildSettlementInput(link),
    );
    expect(repository.createCalls[0].dto).toMatchObject({
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
    });
  });

  it("records a simplified suggestion that is not a direct debt", async () => {
    const { repository, service } = chainedDebtHarness(true);

    await expect(
      service.createGroupSettlement(
        "user-a",
        buildSettlementInput({ fromUserId: "user-a", toUserId: "user-c" }),
      ),
    ).resolves.toBeDefined();
    expect(repository.createCalls[0].dto).toMatchObject({
      participantIds: ["user-a", "user-c"],
      fromUserId: "user-a",
      toUserId: "user-c",
      amountCents: 1000,
      currency: "EUR",
    });
  });

  it("bounds a simplified suggestion by the suggestion amount", async () => {
    const { service } = chainedDebtHarness(true);

    await expect(
      service.createGroupSettlement(
        "user-a",
        buildSettlementInput({
          fromUserId: "user-a",
          toUserId: "user-c",
          amount: "10.01",
        }),
      ),
    ).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_DEBT" });
  });

  it("keeps rejecting a non-direct pair when the group shows direct debts", async () => {
    const { service } = chainedDebtHarness(false);

    await expect(
      service.createGroupSettlement(
        "user-a",
        buildSettlementInput({ fromUserId: "user-a", toUserId: "user-c" }),
      ),
    ).rejects.toMatchObject({ code: "NO_DEBT" });

    await expect(
      service.createGroupSettlement(
        "user-a",
        buildSettlementInput({ fromUserId: "user-a", toUserId: "user-b" }),
      ),
    ).resolves.toBeDefined();
  });

  it("throws the field validation error before touching the repository", async () => {
    const { repository, service } = createDebtHarness();

    await expect(
      service.createGroupSettlement("user-b", buildSettlementInput({ amount: "" })),
    ).rejects.toBeInstanceOf(GroupSettlementValidationError);
    await expect(
      service.createGroupSettlement(
        "user-b",
        buildSettlementInput({ currency: "BIT" }),
      ),
    ).rejects.toBeInstanceOf(GroupSettlementValidationError);
    expect(repository.createCalls).toEqual([]);
  });

  it("keeps the group-expense error family untouched", () => {
    expect(new GroupExpenseValidationError([]).name).toBe(
      "GroupExpenseValidationError",
    );
  });
});
