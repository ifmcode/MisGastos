import {
  cacheSocialRow,
  cacheSocialRows,
  readCachedSocialRows,
} from "@/shared/lib/local-db/social-cache";

import type { SharedExpense } from "../types/shared-expense.types";
import {
  fromSharedExpenseLocalRow,
  toSharedExpenseLocalRow,
} from "./local-shared-expense.mapper";

const COLLECTION = "sharedExpenses" as const;

/** Cached 1:1 expenses of the viewer, or null on a cold cache/flag off. */
export async function readCachedSharedExpenses(
  viewerUid: string,
): Promise<SharedExpense[] | null> {
  const rows = await readCachedSocialRows({
    table: COLLECTION,
    ownerId: viewerUid,
    collection: COLLECTION,
  });

  if (rows === null) return null;

  return rows.flatMap((row) => {
    const expense = fromSharedExpenseLocalRow(row);
    return expense ? [expense] : [];
  });
}

export async function cacheSharedExpenses(
  viewerUid: string,
  expenses: readonly SharedExpense[],
  now: string,
): Promise<void> {
  await cacheSocialRows({
    table: COLLECTION,
    ownerId: viewerUid,
    collection: COLLECTION,
    rows: expenses.map((expense) =>
      toSharedExpenseLocalRow(expense, viewerUid),
    ),
    now,
  });
}

export async function cacheSharedExpense(
  viewerUid: string,
  expense: SharedExpense,
  now: string,
): Promise<void> {
  await cacheSocialRow(
    COLLECTION,
    viewerUid,
    toSharedExpenseLocalRow(expense, viewerUid),
    now,
  );
}
