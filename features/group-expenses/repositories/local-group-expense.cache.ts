import {
  cacheSocialRow,
  cacheSocialRows,
  readCachedSocialRows,
} from "@/shared/lib/local-db/social-cache";

import type { GroupExpense } from "../types/group-expense.types";
import {
  fromGroupExpenseLocalRow,
  toGroupExpenseLocalRow,
} from "./local-group-expense.mapper";

const TABLE = "groupExpenses" as const;

function collectionKey(groupId: string): string {
  return `groupExpenses:${groupId}`;
}

/** Cached expenses of one group, or null on a cold cache/flag off. */
export async function readCachedGroupExpenses(
  viewerUid: string,
  groupId: string,
): Promise<GroupExpense[] | null> {
  const rows = await readCachedSocialRows({
    table: TABLE,
    ownerId: viewerUid,
    collection: collectionKey(groupId),
    scope: { groupId },
  });

  if (rows === null) return null;

  return rows.flatMap((row) => {
    const expense = fromGroupExpenseLocalRow(row);
    return expense ? [expense] : [];
  });
}

/** One cached expense by id, independent of its group; used by `getExpense`. */
export async function readCachedGroupExpenseById(
  viewerUid: string,
  expenseId: string,
): Promise<GroupExpense | null> {
  const rows = await readCachedSocialRows({
    table: TABLE,
    ownerId: viewerUid,
    collection: "groupExpenses:*",
  });

  const row = rows?.find((candidate) => candidate.id === expenseId);
  return row ? fromGroupExpenseLocalRow(row) : null;
}

export async function cacheGroupExpenses(
  viewerUid: string,
  groupId: string,
  expenses: readonly GroupExpense[],
  now: string,
): Promise<void> {
  await cacheSocialRows({
    table: TABLE,
    ownerId: viewerUid,
    collection: collectionKey(groupId),
    scope: { groupId },
    rows: expenses.map((expense) =>
      toGroupExpenseLocalRow(expense, viewerUid),
    ),
    now,
  });
}

export async function cacheGroupExpense(
  viewerUid: string,
  expense: GroupExpense,
  now: string,
): Promise<void> {
  await cacheSocialRow(
    TABLE,
    viewerUid,
    toGroupExpenseLocalRow(expense, viewerUid),
    now,
  );
}
