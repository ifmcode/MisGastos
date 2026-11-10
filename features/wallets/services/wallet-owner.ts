import {
  WalletValidationIssue,
} from "../schemas/wallet.schema";
import { WalletValidationError } from "./wallet.errors";

export function getOwnerIssue(action: string): WalletValidationIssue {
  return {
    field: "ownerId",
    code: "OWNER_REQUIRED",
    message: `Debes iniciar sesión para ${action}.`,
  };
}

function walletIdIssue(): WalletValidationIssue {
  return {
    field: "walletId",
    code: "WALLET_REQUIRED",
    message: "Selecciona una cartera válida.",
  };
}

export function normalizeOwnerId(ownerId: string, action: string): string {
  const normalizedOwnerId = ownerId.trim();
  if (normalizedOwnerId.length === 0) {
    throw new WalletValidationError([getOwnerIssue(action)]);
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
