import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { GroupExpenseOperationError } from "../services/group-expense.errors";
import type {
  CreateGroupExpenseDto,
  GroupExpense,
  UpdateGroupExpenseDto,
} from "../types/group-expense.types";
import {
  toGroupExpenseData,
  toGroupExpenseUpdateData,
} from "./group-expenses.data";
import { mapGroupExpenseDocument } from "./group-expenses.mapper";

/** Root collection with a `groupId` field; see the type-level trade-off note. */
export const GROUP_EXPENSES_COLLECTION = "groupExpenses";

// No `runTransaction` here on purpose: a group expense is a single document and
// never writes a wallet, a category or a linked movement, so there is no balance
// to keep in sync with it. Net balances are derived from these rows (TICKET-010).

export async function getGroupExpenseOperation(
  expenseId: string,
): Promise<GroupExpense | null> {
  const snapshot = await getDoc(doc(db, GROUP_EXPENSES_COLLECTION, expenseId));
  if (!snapshot.exists()) return null;

  return mapGroupExpenseDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}

/**
 * Single `where('groupId', '==', groupId)` with a client-side sort: one
 * single-field index, no composite index, soft-deleted rows included.
 */
export async function getGroupExpensesOperation(
  groupId: string,
): Promise<GroupExpense[]> {
  const snapshot = await getDocs(
    query(
      collection(db, GROUP_EXPENSES_COLLECTION),
      where("groupId", "==", groupId),
    ),
  );

  const expenses: GroupExpense[] = [];

  for (const document of snapshot.docs) {
    const expense = mapGroupExpenseDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (expense) expenses.push(expense);
  }

  return expenses;
}

/** Generates the document id client-side so the record exists in one write. */
export async function createGroupExpenseOperation(
  dto: CreateGroupExpenseDto,
): Promise<GroupExpense> {
  const expenseRef = doc(collection(db, GROUP_EXPENSES_COLLECTION));
  const data = toGroupExpenseData(dto);

  await setDoc(expenseRef, data);

  const expense = mapGroupExpenseDocument(expenseRef.id, data);
  if (!expense) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

  return expense;
}

export async function updateGroupExpenseOperation(
  expenseId: string,
  update: UpdateGroupExpenseDto,
): Promise<GroupExpense> {
  await updateDoc(
    doc(db, GROUP_EXPENSES_COLLECTION, expenseId),
    toGroupExpenseUpdateData(update),
  );

  const expense = await getGroupExpenseOperation(expenseId);
  if (!expense) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

  return expense;
}

/**
 * Soft delete: only `deletedAt` and `updatedAt` change, which is the exact
 * `diff` the rules allow, and the record keeps its audit trail.
 */
export async function softDeleteGroupExpenseOperation(
  expenseId: string,
  deletedAt: string,
): Promise<void> {
  await updateDoc(doc(db, GROUP_EXPENSES_COLLECTION, expenseId), {
    deletedAt,
    updatedAt: deletedAt,
  });
}
