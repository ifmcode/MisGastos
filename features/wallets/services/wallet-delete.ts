import { IWalletRepository } from "../repositories/wallet.repository";
import {
  DeleteWalletOptions,
  WalletDeletionResult,
} from "../types/wallet.types";
import { WalletOperationError } from "./wallet.errors";

/** Guards target compatibility before delegating the destructive operation. */
export async function deleteWalletWithRepository(
  repository: IWalletRepository,
  ownerId: string,
  walletId: string,
  options: DeleteWalletOptions,
): Promise<WalletDeletionResult> {
  const existing = await repository.getWallet(ownerId, walletId);
  if (!existing) throw new WalletOperationError("WALLET_NOT_FOUND");

  const usage = await repository.getWalletUsage(ownerId, walletId);

  if (usage.hasMovements && options.mode === "reassign") {
    const targetWalletId = options.targetWalletId?.trim() ?? "";
    if (targetWalletId.length === 0) {
      throw new WalletOperationError("TARGET_WALLET_REQUIRED");
    }
    if (targetWalletId === walletId) {
      throw new WalletOperationError("TARGET_WALLET_SAME");
    }

    const target = await repository.getWallet(ownerId, targetWalletId);
    if (!target) throw new WalletOperationError("TARGET_WALLET_NOT_FOUND");
    if (target.archivedAt) {
      throw new WalletOperationError("TARGET_WALLET_ARCHIVED");
    }
    if (target.currency !== existing.currency) {
      throw new WalletOperationError("TARGET_WALLET_CURRENCY_MISMATCH");
    }
  }

  return repository.deleteWallet(ownerId, walletId, options);
}
