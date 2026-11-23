import { collection, doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { FirebaseLinkedMovementPort } from "@/features/shared-expenses/repositories/firebase-linked-movement.port";
import type { ILinkedMovementPort } from "@/features/shared-expenses/repositories/linked-movement.port";
import {
  newMovementRef,
  walletRef,
} from "@/features/shared-expenses/repositories/shared-expense-movement-ref";

import { GroupExpenseOperationError } from "../services/group-expense.errors";
import type {
  CreateGroupExpenseDto,
  GroupExpense,
} from "../types/group-expense.types";
import {
  assertSufficientBalance,
  readWalletBalance,
} from "./group-expense-link.helpers";
import { toGroupExpenseData } from "./group-expenses.data";
import { mapGroupExpenseDocument } from "./group-expenses.mapper";
import { GROUP_EXPENSES_COLLECTION } from "./group-expenses.operations";

/**
 * Creates the group expense and its linked personal movement in one
 * transaction. The wallet is validated inside the transaction, so an
 * insufficient balance writes neither record. The group ledger never reads the
 * movement: it depends only on the amount, the payer and the stored shares.
 */
export async function createGroupExpenseLinkOperation(
  dto: CreateGroupExpenseDto,
  port: ILinkedMovementPort = new FirebaseLinkedMovementPort(),
): Promise<GroupExpense> {
  const walletId = dto.walletId ?? "";

  if (walletId.length === 0) {
    throw new GroupExpenseOperationError("WALLET_NOT_FOUND");
  }

  // The service already rejects a link without its category; keeping the check
  // here makes the operation self-contained for any other caller.
  if ((dto.categoryId ?? "").trim().length === 0) {
    throw new GroupExpenseOperationError("CATEGORY_REQUIRED");
  }

  const now = dto.updatedAt;
  const wallet = walletRef(walletId);
  const movement = newMovementRef();
  const expense = doc(collection(db, GROUP_EXPENSES_COLLECTION));
  let created: GroupExpense | null = null;

  await runTransaction(db, async (transaction) => {
    const walletSnapshot = await transaction.get(wallet);
    const balance = readWalletBalance(walletSnapshot, dto.payerId, dto.currency);
    const nextBalance = port.applyAmountToBalance(balance, dto.amountCents);
    assertSufficientBalance(nextBalance);

    const expenseData = {
      ...toGroupExpenseData(dto),
      linkedTransactionId: movement.id,
    };

    transaction.set(expense, expenseData);
    transaction.set(
      movement,
      port.buildCreateData({
        movementId: movement.id,
        ownerId: dto.payerId,
        walletId,
        groupExpenseId: expense.id,
        amountCents: dto.amountCents,
        currency: dto.currency,
        categoryId: dto.categoryId ?? "",
        concept: dto.description,
        date: dto.date,
        createdAt: now,
        updatedAt: now,
      }),
    );
    transaction.update(wallet, { balance: nextBalance, updatedAt: now });

    created = mapGroupExpenseDocument(expense.id, expenseData);
  });

  if (!created) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

  return created;
}
