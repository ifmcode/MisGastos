import { collection, doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { nextRevision } from "@/shared/utils/revision";

import { SharedExpenseOperationError } from "../services/shared-expense.errors";
import type {
  CreateSharedExpenseDto,
  SharedExpense,
} from "../types/shared-expense.types";
import { FirebaseLinkedMovementPort } from "./firebase-linked-movement.port";
import type { ILinkedMovementPort } from "./linked-movement.port";
import {
  assertSufficientBalance,
  readWalletBalance,
} from "./shared-expense-link.helpers";
import { mapSharedExpenseDocument } from "./shared-expenses.mapper";
import { toExpenseData } from "./shared-expenses.data";
import { SHARED_EXPENSES_COLLECTION } from "./shared-expenses.operations";
import { newMovementRef, walletRef } from "./shared-expense-movement-ref";

/**
 * Creates the shared expense and its linked movement in one transaction. The
 * wallet is validated inside the transaction, so an insufficient balance writes
 * neither record.
 */
export async function createSharedExpenseLinkOperation(
  dto: CreateSharedExpenseDto,
  port: ILinkedMovementPort = new FirebaseLinkedMovementPort(),
): Promise<SharedExpense> {
  const walletId = dto.walletId ?? "";

  if (walletId.length === 0) {
    throw new SharedExpenseOperationError("WALLET_NOT_FOUND");
  }

  const now = dto.updatedAt;
  const wallet = walletRef(walletId);
  const movement = newMovementRef();
  const expense = doc(collection(db, SHARED_EXPENSES_COLLECTION));
  let created: SharedExpense | null = null;

  await runTransaction(db, async (transaction) => {
    const walletSnapshot = await transaction.get(wallet);
    const balance = readWalletBalance(walletSnapshot, dto.payerId, dto.currency);
    const nextBalance = port.applyAmountToBalance(balance, dto.amountCents);
    assertSufficientBalance(nextBalance);

    const expenseData = {
      ...toExpenseData(dto),
      linkedTransactionId: movement.id,
    };

    transaction.set(expense, expenseData);
    transaction.set(
      movement,
      port.buildCreateData({
        movementId: movement.id,
        ownerId: dto.payerId,
        walletId,
        sharedExpenseId: expense.id,
        amountCents: dto.amountCents,
        currency: dto.currency,
        categoryId: dto.categoryId ?? "",
        concept: dto.description,
        date: dto.date,
        createdAt: now,
        updatedAt: now,
      }),
    );
    transaction.update(wallet, {
      balance: nextBalance,
      updatedAt: now,
      revision: nextRevision(walletSnapshot.data()),
    });

    created = mapSharedExpenseDocument(expense.id, expenseData);
  });

  if (!created) throw new SharedExpenseOperationError("EXPENSE_NOT_FOUND");

  return created;
}
