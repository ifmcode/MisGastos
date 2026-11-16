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

import { SharedExpenseOperationError } from "../services/shared-expense.errors";
import type {
  CreateSharedExpenseDto,
  SharedExpense,
  UpdateSharedExpenseDto,
} from "../types/shared-expense.types";
import { toExpenseData, toExpenseUpdateData } from "./shared-expenses.data";
import { mapSharedExpenseDocument } from "./shared-expenses.mapper";

export const SHARED_EXPENSES_COLLECTION = "sharedExpenses";

export async function getSharedExpenseOperation(
  expenseId: string,
): Promise<SharedExpense | null> {
  const snapshot = await getDoc(
    doc(db, SHARED_EXPENSES_COLLECTION, expenseId),
  );
  if (!snapshot.exists()) return null;

  return mapSharedExpenseDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}

/** `array-contains` on the participant pair; no composite index needed. */
export async function getSharedExpensesOperation(
  viewerUid: string,
): Promise<SharedExpense[]> {
  const snapshot = await getDocs(
    query(
      collection(db, SHARED_EXPENSES_COLLECTION),
      where("participantIds", "array-contains", viewerUid),
    ),
  );

  const expenses: SharedExpense[] = [];

  for (const document of snapshot.docs) {
    const expense = mapSharedExpenseDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (expense) expenses.push(expense);
  }

  return expenses;
}

/** Generates the document id client-side so the record exists in one write. */
export async function createSharedExpenseOperation(
  dto: CreateSharedExpenseDto,
): Promise<SharedExpense> {
  const expenseRef = doc(collection(db, SHARED_EXPENSES_COLLECTION));
  const data = toExpenseData(dto);

  await setDoc(expenseRef, data);

  const expense = mapSharedExpenseDocument(expenseRef.id, data);
  if (!expense) throw new SharedExpenseOperationError("EXPENSE_NOT_FOUND");

  return expense;
}

export async function updateSharedExpenseOperation(
  expenseId: string,
  update: UpdateSharedExpenseDto,
): Promise<SharedExpense> {
  await updateDoc(
    doc(db, SHARED_EXPENSES_COLLECTION, expenseId),
    toExpenseUpdateData(update),
  );

  const expense = await getSharedExpenseOperation(expenseId);
  if (!expense) throw new SharedExpenseOperationError("EXPENSE_NOT_FOUND");

  return expense;
}

/** Soft delete: the record keeps its audit trail and never leaves the list. */
export async function softDeleteSharedExpenseOperation(
  expenseId: string,
  deletedAt: string,
): Promise<void> {
  await updateDoc(doc(db, SHARED_EXPENSES_COLLECTION, expenseId), {
    deletedAt,
    updatedAt: deletedAt,
  });
}
