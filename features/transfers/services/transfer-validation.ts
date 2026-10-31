import { Wallet } from "@/features/wallets/types/wallet.types";
import { roundMoney } from "@/features/wallets/utils/money";

import {
  CreateTransferDto,
  Transfer,
} from "../types/transfer.types";
import {
  TransferInput,
  TransferValidationIssue,
  validateTransferInput,
} from "../schemas/transfer.schema";
import { hasSufficientBalance } from "../utils/transfer-balance";
import {
  TransferOperationError,
  TransferValidationError,
} from "./transfer.errors";

function ownerIssue(): TransferValidationIssue {
  return {
    field: "ownerId",
    code: "OWNER_REQUIRED",
    message: "Debes iniciar sesión para gestionar tus transferencias.",
  };
}

/** Trims the owner id and rejects anonymous callers. */
export function requireOwnerId(ownerId: string): string {
  const normalizedOwnerId = ownerId.trim();

  if (normalizedOwnerId.length === 0) {
    throw new TransferValidationError([ownerIssue()]);
  }

  return normalizedOwnerId;
}

export interface TransferRequest {
  ownerId: string;
  value: CreateTransferDto;
}

/** Validates the owner and the transfer fields before touching Firestore. */
export function validateTransferRequest(
  ownerId: string,
  input: TransferInput,
): TransferRequest {
  const normalizedOwnerId = ownerId.trim();
  const issues: TransferValidationIssue[] = [];
  const validation = validateTransferInput(input);

  if (normalizedOwnerId.length === 0) {
    issues.push(ownerIssue());
  }

  if (!validation.ok) {
    throw new TransferValidationError([...issues, ...validation.error]);
  }

  if (issues.length > 0) {
    throw new TransferValidationError(issues);
  }

  return { ownerId: normalizedOwnerId, value: validation.value };
}

function findWallet(
  wallets: readonly Wallet[],
  walletId: string,
): Wallet | null {
  return wallets.find((wallet) => wallet.id === walletId) ?? null;
}

/** Balance of the source wallet, adding back the amount of the edited transfer. */
function getAvailableBalance(fromWallet: Wallet, previous?: Transfer): number {
  if (!previous) return fromWallet.balance;

  let balance = fromWallet.balance;

  if (previous.fromWalletId === fromWallet.id) {
    balance += previous.amount;
  }
  if (previous.toWalletId === fromWallet.id) {
    balance -= previous.amount;
  }

  return roundMoney(balance);
}

export interface EnsureTransferWalletsOptions {
  wallets: readonly Wallet[];
  value: CreateTransferDto;
  /** Existing transfer when editing, so its original amount is not double-counted. */
  previous?: Transfer;
}

/** Checks both wallets exist, are compatible and have enough balance. */
export function ensureTransferWallets({
  wallets,
  value,
  previous,
}: EnsureTransferWalletsOptions): void {
  const fromWallet = findWallet(wallets, value.fromWalletId);
  const toWallet = findWallet(wallets, value.toWalletId);

  if (!fromWallet) {
    throw new TransferOperationError("FROM_WALLET_NOT_FOUND");
  }

  if (!toWallet) {
    throw new TransferOperationError("TO_WALLET_NOT_FOUND");
  }

  if (fromWallet.id === toWallet.id) {
    throw new TransferOperationError("SAME_WALLET");
  }

  if (
    fromWallet.currency !== toWallet.currency ||
    fromWallet.currency !== value.currency
  ) {
    throw new TransferOperationError("CURRENCY_MISMATCH");
  }

  if (
    !hasSufficientBalance(
      getAvailableBalance(fromWallet, previous),
      value.amount,
    )
  ) {
    throw new TransferOperationError("INSUFFICIENT_FUNDS");
  }
}
