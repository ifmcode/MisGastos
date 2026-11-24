import type { CurrencyCode } from "@/shared/constants/currencies";
import { nextRevision } from "@/shared/utils/revision";
import type {
  ILinkedMovementPort,
  LinkedMovementState,
} from "@/features/shared-expenses/repositories/linked-movement.port";
import type { SnapshotView } from "@/features/shared-expenses/repositories/shared-expense-link.helpers";
import {
  movementRef,
  walletRef,
} from "@/features/shared-expenses/repositories/shared-expense-movement-ref";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";

import { GroupExpenseOperationError } from "../services/group-expense.errors";
import type {
  GroupExpense,
  UpdateGroupExpenseDto,
} from "../types/group-expense.types";
import {
  assertSufficientBalance,
  readWalletBalance,
  toMovementSnapshot,
} from "./group-expense-link.helpers";
import { writeGroupMovement } from "./group-expense-movement-write";

/** Only the transaction surface the link operations use (no Firestore types). */
export interface GroupLinkTransaction {
  get(reference: unknown): Promise<SnapshotView>;
  update(reference: unknown, data: Record<string, unknown>): void;
  set(reference: unknown, data: Record<string, unknown>): void;
}

export interface MovementSyncContext {
  viewerUid: string;
  previous: LinkedMovementState | null;
  port: ILinkedMovementPort;
  now: string;
}

/** Movement that still affects its wallet; soft-deleted ones were reverted. */
export function readActiveMovement(
  movement: LinkedMovementState | null,
): LinkedMovementState | null {
  return movement && movement.deletedAt === null ? movement : null;
}

export async function readStoredMovement(
  transaction: GroupLinkTransaction,
  expense: GroupExpense,
  port: ILinkedMovementPort,
): Promise<LinkedMovementState | null> {
  const id = expense.linkedTransactionId;

  if (!id) return null;

  const snapshot = await transaction.get(movementRef(id));

  return port.readMovement(id, toMovementSnapshot(snapshot));
}

/** Reverts one movement from its wallet, exactly once per call. */
export async function revertMovementWallet(
  transaction: GroupLinkTransaction,
  movement: LinkedMovementState,
  viewerUid: string,
  currency: CurrencyCode,
  now: string,
  port: ILinkedMovementPort,
): Promise<void> {
  // A permanently deleted wallet keeps the movement under the virtual wallet
  // with no balance to revert; touching it would brick the expense.
  if (isOrphanedWalletId(movement.walletId)) return;

  const reference = walletRef(movement.walletId);
  const snapshot = await transaction.get(reference);
  const balance = readWalletBalance(snapshot, viewerUid, currency);

  transaction.update(reference, {
    balance: port.revertAmountFromBalance(balance, movement.amountCents),
    updatedAt: now,
    revision: nextRevision(snapshot.data()),
  });
}

/**
 * Applies the new spend to the selected wallet and writes the single linked
 * movement. The previous effect is reverted first, so an edit is counted once.
 */
export async function syncMovementWallet(
  transaction: GroupLinkTransaction,
  stored: GroupExpense,
  update: UpdateGroupExpenseDto,
  context: MovementSyncContext,
): Promise<string> {
  const { viewerUid, previous, port, now } = context;
  const walletId = update.walletId ?? "";
  const active = readActiveMovement(previous);

  if (update.payerId !== viewerUid) {
    throw new GroupExpenseOperationError("WALLET_NOT_OWNED");
  }

  // The wallet was permanently deleted: the movement keeps its history but has
  // no balance to update. A previous real wallet is still reverted so a wallet
  // move cannot leave value behind.
  if (isOrphanedWalletId(walletId)) {
    if (active && !isOrphanedWalletId(active.walletId)) {
      await revertMovementWallet(
        transaction,
        active,
        viewerUid,
        stored.currency,
        now,
        port,
      );
    }

    return writeGroupMovement(transaction, stored, update, context);
  }

  const destinationRef = walletRef(walletId);
  const destination = await transaction.get(destinationRef);
  const destinationBalance = readWalletBalance(
    destination,
    viewerUid,
    update.currency,
  );
  const reverted =
    active && active.walletId === walletId
      ? port.revertAmountFromBalance(destinationBalance, active.amountCents)
      : destinationBalance;
  const nextBalance = port.applyAmountToBalance(reverted, update.amountCents);
  assertSufficientBalance(nextBalance);

  if (active && active.walletId !== walletId) {
    await revertMovementWallet(
      transaction,
      active,
      viewerUid,
      stored.currency,
      now,
      port,
    );
  }

  transaction.update(destinationRef, {
    balance: nextBalance,
    updatedAt: now,
    revision: nextRevision(destination.data()),
  });

  return writeGroupMovement(transaction, stored, update, context);
}
