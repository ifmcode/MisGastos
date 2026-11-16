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
  SharedExpenseParticipant,
  UpdateSharedExpenseDto,
} from "../types/shared-expense.types";
import { mapSharedExpenseDocument } from "./shared-expenses.mapper";

export const SHARED_EXPENSES_COLLECTION = "sharedExpenses";

/** Drops `undefined` optionals: Firestore rejects undefined field values. */
function toParticipantData(
  participant: SharedExpenseParticipant,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    userId: participant.userId,
    shareCents: participant.shareCents,
  };

  if (participant.percentageBps !== undefined) {
    data.percentageBps = participant.percentageBps;
  }
  if (participant.weight !== undefined) data.weight = participant.weight;

  return data;
}

function toExpenseData(dto: CreateSharedExpenseDto): Record<string, unknown> {
  return {
    participantIds: dto.participantIds,
    pairId: dto.pairId,
    payerId: dto.payerId,
    amountCents: dto.amountCents,
    currency: dto.currency,
    splitMode: dto.splitMode,
    participants: dto.participants.map(toParticipantData),
    description: dto.description,
    date: dto.date,
    createdBy: dto.createdBy,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt,
  };
}

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
  await updateDoc(doc(db, SHARED_EXPENSES_COLLECTION, expenseId), {
    payerId: update.payerId,
    amountCents: update.amountCents,
    currency: update.currency,
    splitMode: update.splitMode,
    participants: update.participants.map(toParticipantData),
    description: update.description,
    date: update.date,
    updatedAt: update.updatedAt,
  });

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
