import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { addGroupActivity } from "@/features/groups/repositories/group-activity.writes";

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

// Reads stay outside any transaction: a group expense is a single document. The
// writes pair the expense with its `groups/{groupId}/activity` event in one
// batch or transaction; the group ledger is still derived from these rows.

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
  const batch = writeBatch(db);

  batch.set(expenseRef, data);
  addGroupActivity(batch, {
    type: "expense-created",
    groupId: dto.groupId,
    actorId: dto.createdBy,
    expenseId: expenseRef.id,
    amountCents: dto.amountCents,
    currency: dto.currency,
    description: dto.description,
    createdAt: dto.createdAt,
  });
  await batch.commit();

  const expense = mapGroupExpenseDocument(expenseRef.id, data);
  if (!expense) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

  return expense;
}

export async function updateGroupExpenseOperation(
  expenseId: string,
  update: UpdateGroupExpenseDto,
  viewerUid: string,
): Promise<GroupExpense> {
  const expenseRef = doc(db, GROUP_EXPENSES_COLLECTION, expenseId);
  const data = toGroupExpenseUpdateData(update);
  let result: GroupExpense | null = null;

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(expenseRef);
    if (!snapshot.exists()) {
      throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");
    }

    const stored = mapGroupExpenseDocument(
      snapshot.id,
      snapshot.data() as Record<string, unknown>,
    );
    if (!stored) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

    transaction.update(expenseRef, data);
    addGroupActivity(transaction, {
      type: "expense-updated",
      groupId: stored.groupId,
      actorId: viewerUid,
      expenseId,
      amountCents: update.amountCents,
      currency: update.currency,
      description: update.description,
      createdAt: update.updatedAt,
    });
    result = mapGroupExpenseDocument(expenseId, {
      ...(snapshot.data() ?? {}),
      ...data,
    });
  });

  if (!result) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

  return result;
}
