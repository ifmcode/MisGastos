import type { CurrencyCode } from "@/shared/constants/currencies";

import type { ISettlementMovementPort } from "./settlement-movement.port";
import {
  settlementWalletRef,
  type SettlementTransaction,
} from "./settlement-movement.helpers";
import { readSettlementWallet } from "./settlement-wallet.helpers";

/**
 * Wallet work of an edit, computed before any write so every read happens
 * first (a Firestore transaction cannot read after writing). A `null` id means
 * that side has nothing to move.
 */
export interface SettlementWalletEffects {
  /** Wallet the previous income must be taken out of. */
  revertWalletId: string | null;
  /** Wallet the new income must be added to. */
  applyWalletId: string | null;
  previousAmountCents: number;
  nextAmountCents: number;
}

function collectWalletIds(effects: SettlementWalletEffects): string[] {
  const ids: string[] = [];

  if (effects.revertWalletId) ids.push(effects.revertWalletId);
  if (effects.applyWalletId && !ids.includes(effects.applyWalletId)) {
    ids.push(effects.applyWalletId);
  }

  return ids;
}

/**
 * Reverts the previous income and applies the next one, once per wallet. When
 * both sides are the same wallet the balance is updated with a single write, so
 * an edit can never double-count the income.
 */
export async function applySettlementWalletEffects(
  transaction: SettlementTransaction,
  effects: SettlementWalletEffects,
  creditorId: string,
  currency: CurrencyCode,
  now: string,
  port: ISettlementMovementPort,
): Promise<void> {
  const ids = collectWalletIds(effects);
  const balances = new Map<string, number>();

  for (const walletId of ids) {
    const snapshot = await transaction.get(settlementWalletRef(walletId));
    balances.set(
      walletId,
      readSettlementWallet(
        snapshot,
        creditorId,
        currency,
        // A revert-only wallet may be archived; linking or resizing an income
        // still requires an active wallet.
        walletId !== effects.applyWalletId,
      ),
    );
  }

  for (const walletId of ids) {
    const balance = balances.get(walletId) ?? 0;
    const reverted =
      walletId === effects.revertWalletId
        ? port.revertAmountFromBalance(balance, effects.previousAmountCents)
        : balance;
    const next =
      walletId === effects.applyWalletId
        ? port.applyAmountToBalance(reverted, effects.nextAmountCents)
        : reverted;

    transaction.update(settlementWalletRef(walletId), {
      balance: next,
      updatedAt: now,
    });
  }
}
