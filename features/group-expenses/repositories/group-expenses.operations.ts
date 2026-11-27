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
import { assertServerSnapshot } from "@/shared/lib/local-db/offline-read";
import { INITIAL_REVISION, nextRevision } from "@/shared/utils/revision";
import { addGroupActivity } from "@/features/groups/repositories/group-activity.writes";
import {
  assertExpectedRevision,
  readAppliedRevision,
  writeAppliedMutation,
  type SocialMutationContext,
} from "@/shared/services/sync/firestore-idempotency";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";

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

/** Inputs the sync executor adds to the otherwise unchanged server operation. */
export interface GroupExpenseMutationOptions {
  id?: string;
  sync?: SocialMutationContext;
}

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
  assertServerSnapshot(snapshot);

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
  options: GroupExpenseMutationOptions = {},
): Promise<GroupExpense> {
  const expenseRef = options.id
    ? doc(db, GROUP_EXPENSES_COLLECTION, options.id)
    : doc(collection(db, GROUP_EXPENSES_COLLECTION));
  const data = toGroupExpenseData(dto);
  let created: GroupExpense | null = null;

  if (!options.sync) {
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

    created = mapGroupExpenseDocument(expenseRef.id, data);
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
          ? mapGroupExpenseDocument(
              expenseRef.id,
              snapshot.data() as Record<string, unknown>,
            )
          : null;
        return;
      }

      transaction.set(expenseRef, data);
      addGroupActivity(transaction, {
        type: "expense-created",
        groupId: dto.groupId,
        actorId: dto.createdBy,
        expenseId: expenseRef.id,
        amountCents: dto.amountCents,
        currency: dto.currency,
        description: dto.description,
        createdAt: dto.createdAt,
      });
      writeAppliedMutation(transaction, {
        ownerId: options.sync!.ownerId,
        context: options.sync!,
        entityType: "group-expense",
        entityId: expenseRef.id,
        revisionAfter: INITIAL_REVISION,
        now: dto.updatedAt,
      });

      created = mapGroupExpenseDocument(expenseRef.id, data);
    });
  }

  if (!created) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

  return created;
}

export async function updateGroupExpenseOperation(
  expenseId: string,
  update: UpdateGroupExpenseDto,
  viewerUid: string,
  options: GroupExpenseMutationOptions = {},
): Promise<GroupExpense> {
  const expenseRef = doc(db, GROUP_EXPENSES_COLLECTION, expenseId);
  let result: GroupExpense | null = null;

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
          ? mapGroupExpenseDocument(
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
        : new GroupExpenseOperationError("EXPENSE_NOT_FOUND");
    }

    const data = snapshot.data() as Record<string, unknown>;
    const stored = mapGroupExpenseDocument(expenseId, data);
    if (!stored) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");
    if (options.sync) assertExpectedRevision(data, options.sync);

    if (stored.deletedAt !== null) {
      throw options.sync
        ? new SyncMutationError("DELETED_REMOTELY")
        : new GroupExpenseOperationError("ALREADY_DELETED");
    }

    const patch = {
      ...toGroupExpenseUpdateData(update),
      revision: nextRevision(data),
    };

    transaction.update(expenseRef, patch);
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

    if (options.sync) {
      writeAppliedMutation(transaction, {
        ownerId: options.sync.ownerId,
        context: options.sync,
        entityType: "group-expense",
        entityId: expenseId,
        revisionAfter: patch.revision,
        now: update.updatedAt,
      });
    }

    result = mapGroupExpenseDocument(expenseId, { ...data, ...patch });
  });

  if (!result) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

  return result;
}
