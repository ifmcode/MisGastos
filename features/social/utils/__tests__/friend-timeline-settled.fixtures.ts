import { buildSettlement } from "@/features/settlements/utils/__tests__/settlement.fixtures";
import type { Settlement } from "@/features/settlements/types/settlement.types";
import { buildSharedExpense } from "@/features/shared-expenses/utils/__tests__/shared-expense.fixtures";
import type { SharedExpense } from "@/features/shared-expenses/types/shared-expense.types";

import { buildFriendTimelineGroups } from "../friend-timeline-settled";

export const viewerUid = "user-a";
export const friendUid = "user-b";

/** Viewer pays 5,00 EUR, so the friend owes 5,00: the fixture default. */
export function buildViewerExpense(
  overrides: Partial<SharedExpense> = {},
): SharedExpense {
  return buildSharedExpense({ id: "expense-1", ...overrides });
}

/** Friend pays 10,00 EUR and the viewer owes 5,00. */
export function buildFriendExpense(
  overrides: Partial<SharedExpense> = {},
): SharedExpense {
  return buildSharedExpense({
    id: "expense-friend",
    payerId: friendUid,
    participants: [
      { userId: viewerUid, shareCents: 500 },
      { userId: friendUid, shareCents: 500 },
    ],
    ...overrides,
  });
}

/** Friend pays the viewer back: the reverse edge of the viewer expense. */
export function buildFullSettlement(
  overrides: Partial<Settlement> = {},
): Settlement {
  return buildSettlement({
    id: "settlement-1",
    fromUserId: friendUid,
    toUserId: viewerUid,
    amountCents: 500,
    createdAt: "2026-11-11T09:00:00.000Z",
    ...overrides,
  });
}

export function groupsOf(
  expenses: readonly SharedExpense[],
  settlements: readonly Settlement[],
) {
  return buildFriendTimelineGroups({
    expenses,
    settlements,
    viewerUid,
    friendUid,
  });
}
