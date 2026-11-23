import { FakeGroupsRepository } from "@/features/groups/services/__tests__/groups-service.fakes";

import type { GroupExpense } from "../../types/group-expense.types";
import type { GroupSettlementInput } from "../../types/group-settlement.types";
import { GroupSettlementsService } from "../group-settlements.service";
import {
  FakeGroupExpensesRepository,
  GROUP_ID,
  buildExpense,
  buildGroup,
} from "./group-expenses-service.fakes";
import {
  FakeGroupSettlementsRepository,
  buildGroupSettlement,
} from "./group-settlements-service.fakes";

export { GROUP_ID, buildExpense, buildGroup, buildGroupSettlement };

/** `user-b` owes `user-c` 10 € in the group: the pair the form opens from. */
export function pairDebtExpense(
  overrides: Partial<GroupExpense> = {},
): GroupExpense {
  return buildExpense({
    id: "debt",
    payerId: "user-c",
    amountCents: 1000,
    participants: [
      { userId: "user-b", shareCents: 1000 },
      { userId: "user-c", shareCents: 0 },
    ],
    ...overrides,
  });
}

export function buildSettlementInput(
  overrides: Partial<GroupSettlementInput> = {},
): GroupSettlementInput {
  return {
    groupId: GROUP_ID,
    fromUserId: "user-b",
    toUserId: "user-c",
    amount: "10.00",
    currency: "EUR",
    date: "2026-11-10",
    note: "Dinner",
    ...overrides,
  };
}

export interface GroupSettlementHarness {
  repository: FakeGroupSettlementsRepository;
  expenses: FakeGroupExpensesRepository;
  groups: FakeGroupsRepository;
  service: GroupSettlementsService;
}

/** Group with `user-a` owner plus `user-b` and `user-c`, no rows seeded. */
export function createHarness(): GroupSettlementHarness {
  const repository = new FakeGroupSettlementsRepository();
  const expenses = new FakeGroupExpensesRepository();
  const groups = new FakeGroupsRepository();
  groups.seedGroup(buildGroup());

  return {
    repository,
    expenses,
    groups,
    service: new GroupSettlementsService(repository, groups, expenses),
  };
}

/** Harness with the b→c debt already stored. */
export function createDebtHarness(): GroupSettlementHarness {
  const harness = createHarness();
  harness.expenses.seed(pairDebtExpense());

  return harness;
}
