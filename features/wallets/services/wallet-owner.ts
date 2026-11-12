import { WalletValidationIssue } from "../schemas/wallet.schema";
import { WalletValidationError } from "./wallet.errors";

export function getOwnerIssue(): WalletValidationIssue {
  return { field: "ownerId", code: "OWNER_REQUIRED" };
}

function walletIdIssue(): WalletValidationIssue {
  return { field: "walletId", code: "WALLET_REQUIRED" };
}

export function normalizeOwnerId(ownerId: string): string {
  const normalizedOwnerId = ownerId.trim();
  if (normalizedOwnerId.length === 0) {
    throw new WalletValidationError([getOwnerIssue()]);
  }
  return normalizedOwnerId;
}

export function normalizeWalletId(walletId: string): string {
  const normalizedWalletId = walletId.trim();
  if (normalizedWalletId.length === 0) {
    throw new WalletValidationError([walletIdIssue()]);
  }
  return normalizedWalletId;
}
