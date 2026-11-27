import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { assertServerSnapshot } from "@/shared/lib/local-db/offline-read";
import { INITIAL_REVISION, nextRevision, readStoredRevision } from "@/shared/utils/revision";
import {
  assertExpectedRevision,
  readAppliedRevision,
  writeAppliedMutation,
  type SocialMutationContext,
} from "@/shared/services/sync/firestore-idempotency";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";

import { SharedExpenseOperationError } from "../services/shared-expense.errors";
import type {
  CreateSharedExpenseDto,
  SharedExpense,
  UpdateSharedExpenseDto,
} from "../types/shared-expense.types";
import { toExpenseData, toExpenseUpdateData } from "./shared-expenses.data";
import { mapSharedExpenseDocument } from "./shared-expenses.mapper";

export const SHARED_EXPENSES_COLLECTION = "sharedExpenses";

/** Inputs the sync executor adds to the otherwise unchanged server operation. */
export interface SharedExpenseMutationOptions {
  /** Client-generated document id, so a queued create has a stable id. */
  id?: string;
  /** Present only while draining the outbox. */
  sync?: SocialMutationContext;
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
  assertServerSnapshot(snapshot);

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
  options: SharedExpenseMutationOptions = {},
): Promise<SharedExpense> {
  const expenseRef = options.id
    ? doc(db, SHARED_EXPENSES_COLLECTION, options.id)
    : doc(collection(db, SHARED_EXPENSES_COLLECTION));
  const data = toExpenseData(dto);
  let created: SharedExpense | null = null;

  if (!options.sync) {
    await setDoc(expenseRef, data);
    created = mapSharedExpenseDocument(expenseRef.id, data);
  } else {
    await runTransaction(db, async (transaction) => {
      const replay = await readAppliedRevision(
        transaction,
        options.sync!.ownerId,
        options.sync!,
      );

      if (replay !== null) {
        const snapshot = await transaction.get(expenseRef);
        created = snapshot.exists()
          ? mapSharedExpenseDocument(
              expenseRef.id,
              snapshot.data() as Record<string, unknown>,
            )
          : null;
        return;
      }

      transaction.set(expenseRef, data);
      writeAppliedMutation(transaction, {
        ownerId: options.sync!.ownerId,
        context: options.sync!,
        entityType: "shared-expense",
        entityId: expenseRef.id,
        revisionAfter: INITIAL_REVISION,
        now: dto.updatedAt,
      });
      created = mapSharedExpenseDocument(expenseRef.id, data);
    });
  }

  if (!created) throw new SharedExpenseOperationError("EXPENSE_NOT_FOUND");

  return created;
}

export async function updateSharedExpenseOperation(
  expenseId: string,
  update: UpdateSharedExpenseDto,
  options: SharedExpenseMutationOptions = {},
): Promise<SharedExpense> {
  const expenseRef = doc(db, SHARED_EXPENSES_COLLECTION, expenseId);
  let result: SharedExpense | null = null;

  await runTransaction(db, async (transaction) => {
    if (options.sync) {
      const replay = await readAppliedRevision(
        transaction,
        options.sync.ownerId,
        options.sync,
      );

      if (replay !== null) {
        const snapshot = await transaction.get(expenseRef);
        result = snapshot.exists()
          ? mapSharedExpenseDocument(
              expenseId,
              snapshot.data() as Record<string, unknown>,
            )
          : null;
        return;
      }
    }

    const snapshot = await transaction.get(expenseRef);
    if (!snapshot.exists()) {
      throw options.sync
        ? new SyncMutationError("DELETED_REMOTELY")
        : new SharedExpenseOperationError("EXPENSE_NOT_FOUND");
    }

    const stored = snapshot.data() as Record<string, unknown>;
    if (options.sync) assertExpectedRevision(stored, options.sync);

    if (stored.deletedAt != null) {
      throw options.sync
        ? new SyncMutationError("DELETED_REMOTELY")
        : new SharedExpenseOperationError("ALREADY_DELETED");
    }

    const patch = {
      ...toExpenseUpdateData(update),
      revision: nextRevision(stored),
    };
    transaction.update(expenseRef, patch);

    if (options.sync) {
      writeAppliedMutation(transaction, {
        ownerId: options.sync.ownerId,
        context: options.sync,
        entityType: "shared-expense",
        entityId: expenseId,
        revisionAfter: patch.revision,
        now: update.updatedAt,
      });
    }

    result = mapSharedExpenseDocument(expenseId, { ...stored, ...patch });
  });

  if (!result) throw new SharedExpenseOperationError("EXPENSE_NOT_FOUND");

  return result;
}

/** Soft delete: the record keeps its audit trail and never leaves the list. */
export async function softDeleteSharedExpenseOperation(
  expenseId: string,
  deletedAt: string,
  options: SharedExpenseMutationOptions = {},
): Promise<void> {
  const expenseRef = doc(db, SHARED_EXPENSES_COLLECTION, expenseId);

  await runTransaction(db, async (transaction) => {
    if (options.sync) {
      const replay = await readAppliedRevision(
        transaction,
        options.sync.ownerId,
        options.sync,
      );

      if (replay !== null) return;
    }

    const snapshot = await transaction.get(expenseRef);
    if (!snapshot.exists()) {
      throw options.sync
        ? new SyncMutationError("DELETED_REMOTELY")
        : new SharedExpenseOperationError("EXPENSE_NOT_FOUND");
    }

    const stored = snapshot.data() as Record<string, unknown>;

    if (stored.deletedAt != null) {
      if (options.sync) {
        writeAppliedMutation(transaction, {
          ownerId: options.sync.ownerId,
          context: options.sync,
          entityType: "shared-expense",
          entityId: expenseId,
          revisionAfter: readStoredRevision(stored),
          now: deletedAt,
        });
      }
      return;
    }

    if (options.sync) assertExpectedRevision(stored, options.sync);

    const revision = nextRevision(stored);
    transaction.update(expenseRef, { deletedAt, updatedAt: deletedAt, revision });

    if (options.sync) {
      writeAppliedMutation(transaction, {
        ownerId: options.sync.ownerId,
        context: options.sync,
        entityType: "shared-expense",
        entityId: expenseId,
        revisionAfter: revision,
        now: deletedAt,
      });
    }
  });
}
