import { IWalletRepository } from "../repositories/wallet.repository";
import { applyWalletOrder } from "../utils/wallet-order";
import { normalizeOwnerId } from "./wallet-owner";

/**
 * Persists the owner's requested wallet order. Legacy wallets are normalised to
 * explicit positions on the first move and the batch is skipped when the
 * canonical order already matches, so a no-op never bumps a revision.
 */
export async function persistWalletOrder(
  repository: IWalletRepository,
  ownerId: string,
  orderedIds: readonly string[],
): Promise<void> {
  const normalizedOwnerId = normalizeOwnerId(ownerId);
  const wallets = await repository.getWallets(normalizedOwnerId);

  const { changed } = applyWalletOrder(wallets, orderedIds);
  if (changed.length === 0) return;

  await repository.updateWalletOrders(normalizedOwnerId, changed);
}
