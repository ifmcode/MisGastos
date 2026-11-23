import { describe, expect, it } from "@jest/globals";

import { FakeGroupsRepository } from "@/features/groups/services/__tests__/groups-service.fakes";

import { GroupExpensesService } from "../group-expenses.service";
import {
  FakeGroupExpensesRepository,
  FakeGroupExpenseLinkRepository,
  GROUP_ID,
  buildExpense,
  buildGroup,
} from "./group-expenses-service.fakes";
import {
  FakeGroupSettlementsRepository,
  buildGroupSettlement,
} from "./group-settlements-service.fakes";

const OTHER_GROUP_ID = "user-a__group-2";

function createService() {
  const repository = new FakeGroupExpensesRepository();
  const settlementsRepository = new FakeGroupSettlementsRepository();
  const groupsRepository = new FakeGroupsRepository();

  return {
    repository,
    settlementsRepository,
    groupsRepository,
    service: new GroupExpensesService(
      repository,
      groupsRepository,
      new FakeGroupExpenseLinkRepository(),
      settlementsRepository,
    ),
  };
}

/** 90 € dinner split three ways with user-a paying: +60 / -30 / -30. */
function ninetyEurosDinner() {
  return buildExpense({
    id: "dinner",
    payerId: "user-a",
    amountCents: 9000,
    participants: [
      { userId: "user-a", shareCents: 3000 },
      { userId: "user-b", shareCents: 3000 },
      { userId: "user-c", shareCents: 3000 },
    ],
  });
}

describe("GroupExpensesService.getGroupBalances", () => {
  it("returns the raw nets and the simplified transfers of the group", async () => {
    const { repository, groupsRepository, service } = createService();
    groupsRepository.seedGroup(buildGroup());
    repository.seed(ninetyEurosDinner());

    const balances = await service.getGroupBalances("user-b", GROUP_ID);

    expect(balances.simplifyDebts).toBe(true);
    expect(balances.currencies).toEqual([
      {
        currency: "EUR",
        balances: [
          { userId: "user-a", netCents: 6000 },
          { userId: "user-b", netCents: -3000 },
          { userId: "user-c", netCents: -3000 },
        ],
      },
    ]);
    expect(balances.debts).toEqual([
      { currency: "EUR", fromUserId: "user-b", toUserId: "user-a", amountCents: 3000 },
      { currency: "EUR", fromUserId: "user-c", toUserId: "user-a", amountCents: 3000 },
    ]);
  });

  it("shows direct debts when the group turns simplification off", async () => {
    const { repository, groupsRepository, service } = createService();
    groupsRepository.seedGroup(buildGroup({ simplifyDebts: false }));
    // A owes B 10 and B owes C 10: the raw nets only leave A owing C 10.
    repository.seed(
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
    repository.seed(
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

    const balances = await service.getGroupBalances("user-a", GROUP_ID);

    expect(balances.currencies).toEqual([
      {
        currency: "EUR",
        balances: [
          { userId: "user-a", netCents: -1000 },
          { userId: "user-c", netCents: 1000 },
        ],
      },
    ]);
    expect(balances.debts).toEqual([
      { currency: "EUR", fromUserId: "user-a", toUserId: "user-b", amountCents: 1000 },
      { currency: "EUR", fromUserId: "user-b", toUserId: "user-c", amountCents: 1000 },
    ]);
  });

  it("simplifies A owes B and B owes C into A owes C", async () => {
    const { repository, groupsRepository, service } = createService();
    groupsRepository.seedGroup(buildGroup());
    repository.seed(
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
    repository.seed(
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

    const balances = await service.getGroupBalances("user-a", GROUP_ID);

    expect(balances.debts).toEqual([
      { currency: "EUR", fromUserId: "user-a", toUserId: "user-c", amountCents: 1000 },
    ]);
  });

  it("rejects a non-member and an unknown group", async () => {
    const { repository, groupsRepository, service } = createService();
    const group = groupsRepository.seedGroup(
      buildGroup({ memberIds: ["user-a", "user-b"] }),
    );
    repository.seed(ninetyEurosDinner());

    await expect(
      service.getGroupBalances("user-z", group.id),
    ).rejects.toMatchObject({ code: "NOT_GROUP_MEMBER" });
    expect(await service.getGroupBalances("user-a", group.id)).toBeDefined();

    await expect(
      service.getGroupBalances("user-a", "user-x__missing"),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });

  it("folds an active settlement into the nets and ignores a deleted one", async () => {
    const { repository, settlementsRepository, groupsRepository, service } =
      createService();
    groupsRepository.seedGroup(buildGroup());
    repository.seed(ninetyEurosDinner());
    settlementsRepository.seed(
      buildGroupSettlement({ id: "active", amountCents: 1000 }),
    );
    settlementsRepository.seed(
      buildGroupSettlement({
        id: "deleted",
        amountCents: 1000,
        deletedAt: "2026-11-12T10:00:00.000Z",
      }),
    );

    const balances = await service.getGroupBalances("user-b", GROUP_ID);

    expect(balances.currencies).toEqual([
      {
        currency: "EUR",
        balances: [
          { userId: "user-a", netCents: 6000 },
          { userId: "user-b", netCents: -2000 },
          { userId: "user-c", netCents: -4000 },
        ],
      },
    ]);
    expect(balances.debts).toEqual([
      { currency: "EUR", fromUserId: "user-b", toUserId: "user-a", amountCents: 2000 },
      { currency: "EUR", fromUserId: "user-c", toUserId: "user-a", amountCents: 4000 },
    ]);
  });

  it("requires a signed-in viewer", async () => {
    const { service } = createService();

    await expect(service.getGroupBalances("  ", GROUP_ID)).rejects.toMatchObject(
      { code: "SIGN_IN_REQUIRED" },
    );
  });
});

describe("GroupExpensesService.getGroupBalanceSummaries", () => {
  it("returns the viewer net per group in id order", async () => {
    const { repository, groupsRepository, service } = createService();
    const second = groupsRepository.seedGroup(
      buildGroup({
        id: OTHER_GROUP_ID,
        name: "Piso",
        memberIds: ["user-a", "user-b"],
      }),
    );
    groupsRepository.seedGroup(buildGroup());
    repository.seed(ninetyEurosDinner());
    repository.seed(
      buildExpense({
        id: "rent",
        groupId: second.id,
        payerId: "user-b",
        amountCents: 2000,
        participants: [
          { userId: "user-a", shareCents: 1000 },
          { userId: "user-b", shareCents: 1000 },
        ],
      }),
    );

    const summaries = await service.getGroupBalanceSummaries("user-b");

    expect(summaries).toEqual([
      { groupId: GROUP_ID, balances: [{ currency: "EUR", netCents: -3000 }] },
      { groupId: OTHER_GROUP_ID, balances: [{ currency: "EUR", netCents: 1000 }] },
    ]);
  });

  it("returns an empty balance list for a settled group", async () => {
    const { repository, groupsRepository, service } = createService();
    groupsRepository.seedGroup(
      buildGroup({
        simplifyDebts: false,
        memberIds: ["user-a", "user-b"],
      }),
    );
    // The viewer paid and their own share is the whole expense: net 0.
    repository.seed(
      buildExpense({
        payerId: "user-b",
        amountCents: 1000,
        participants: [
          { userId: "user-a", shareCents: 0 },
          { userId: "user-b", shareCents: 1000 },
        ],
      }),
    );

    await expect(service.getGroupBalanceSummaries("user-b")).resolves.toEqual([
      { groupId: GROUP_ID, balances: [] },
    ]);
  });

  it("skips the groups where the viewer is not a member", async () => {
    const { groupsRepository, service, repository } = createService();
    groupsRepository.seedGroup(
      buildGroup({ ownerId: "user-z", memberIds: ["user-z"] }),
    );
    groupsRepository.seedGroup(buildGroup());
    repository.seed(ninetyEurosDinner());

    const summaries = await service.getGroupBalanceSummaries("user-b");

    expect(summaries.map((summary) => summary.groupId)).toEqual([GROUP_ID]);
  });

  it("requires a signed-in viewer", async () => {
    const { service } = createService();

    await expect(
      service.getGroupBalanceSummaries("   "),
    ).rejects.toMatchObject({ code: "SIGN_IN_REQUIRED" });
  });
});
