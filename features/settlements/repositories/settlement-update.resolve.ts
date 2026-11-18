import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";

import { SettlementOperationError } from "../services/settlement.errors";
import type {
  Settlement,
  UpdateSettlementDto,
} from "../types/settlement.types";
import type { SettlementMovementState } from "./settlement-movement.port";
import type { SettlementWalletEffects } from "./settlement-wallet-effects";

export interface ResolvedSettlementEdit extends SettlementWalletEffects {
  destinationWalletId: string | null;
  destinationCategoryId: string | null;
  wantsLink: boolean;
}

/**
 * Only the creditor may link, unlink or resize their own income movement: the
 * movement lives in their wallet and only they can revert it. The debtor can
 * still edit the date and the note.
 */
export function assertLinkChangeAllowed(
  stored: Settlement,
  update: UpdateSettlementDto,
  viewerIsCreditor: boolean,
): void {
  if (viewerIsCreditor) return;

  const linkChanged =
    update.receiverWalletId !== stored.receiverWalletId ||
    update.receiverCategoryId !== stored.receiverCategoryId;

  if (linkChanged) {
    throw new SettlementOperationError("WALLET_NOT_OWNED");
  }

  if (
    stored.receiverTransactionId !== null &&
    update.amountCents !== stored.amountCents
  ) {
    throw new SettlementOperationError("AMOUNT_LOCKED");
  }
}

function resolveDestination(
  stored: Settlement,
  update: UpdateSettlementDto,
  viewerIsCreditor: boolean,
): { walletId: string | null; categoryId: string | null } {
  return viewerIsCreditor
    ? {
        walletId: update.receiverWalletId,
        categoryId: update.receiverCategoryId,
      }
    : {
        walletId: stored.receiverWalletId,
        categoryId: stored.receiverCategoryId,
      };
}

/**
 * Decides which wallet effects an edit needs. A link and amount that do not
 * change produce no balance write at all, so a repeated save is free.
 */
export function resolveSettlementEdit(
  stored: Settlement,
  update: UpdateSettlementDto,
  viewerIsCreditor: boolean,
  previous: SettlementMovementState | null,
): ResolvedSettlementEdit {
  const destination = resolveDestination(stored, update, viewerIsCreditor);
  const wantsLink =
    destination.walletId !== null && destination.categoryId !== null;

  // The debtor never touches the income: the wallet and the movement belong to
  // the creditor, so an edit from that side has no wallet effect at all.
  if (!viewerIsCreditor) {
    return {
      destinationWalletId: destination.walletId,
      destinationCategoryId: destination.categoryId,
      wantsLink,
      revertWalletId: null,
      applyWalletId: null,
      previousAmountCents: 0,
      nextAmountCents: update.amountCents,
    };
  }

  const amountChanged =
    previous === null || previous.amountCents !== update.amountCents;
  const walletChanged =
    previous === null || previous.walletId !== destination.walletId;
  const keepsPreviousEffect =
    wantsLink && previous !== null && !amountChanged && !walletChanged;

  const revertWalletId =
    keepsPreviousEffect || previous === null || isOrphanedWalletId(previous.walletId)
      ? null
      : previous.walletId;
  const applyWalletId =
    wantsLink &&
    destination.walletId !== null &&
    !isOrphanedWalletId(destination.walletId) &&
    !keepsPreviousEffect
      ? destination.walletId
      : null;

  return {
    destinationWalletId: destination.walletId,
    destinationCategoryId: destination.categoryId,
    wantsLink,
    revertWalletId,
    applyWalletId,
    previousAmountCents: previous?.amountCents ?? 0,
    nextAmountCents: update.amountCents,
  };
}
