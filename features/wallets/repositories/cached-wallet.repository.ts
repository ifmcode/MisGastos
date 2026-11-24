import {
  CreateWalletDto,
  DefaultWalletSeedResult,
  DeleteWalletOptions,
  UpdateWalletDto,
  Wallet,
  WalletDeletionResult,
  WalletUsage,
} from "../types/wallet.types";
import { cacheWallets } from "./local-wallet.cache";
import { IWalletRepository } from "./wallet.repository";

/**
 * Read-through wallet repository. Every method delegates to the remote
 * implementation; only the list read mirrors the result into SQLite, and a
 * cache failure never fails the online read.
 */
export class CachedWalletRepository implements IWalletRepository {
  constructor(private readonly remote: IWalletRepository) {}

  async getWallets(ownerId: string): Promise<Wallet[]> {
    const wallets = await this.remote.getWallets(ownerId);

    try {
      await cacheWallets(ownerId, wallets, new Date().toISOString());
    } catch {
      // Best effort: the online read already succeeded.
    }

    return wallets;
  }

  getWallet(ownerId: string, walletId: string): Promise<Wallet | null> {
    return this.remote.getWallet(ownerId, walletId);
  }

  createWallet(ownerId: string, dto: CreateWalletDto): Promise<Wallet> {
    return this.remote.createWallet(ownerId, dto);
  }

  seedDefaultWallet(
    ownerId: string,
    dto: CreateWalletDto,
  ): Promise<DefaultWalletSeedResult> {
    return this.remote.seedDefaultWallet(ownerId, dto);
  }

  updateWallet(
    ownerId: string,
    walletId: string,
    dto: UpdateWalletDto,
  ): Promise<Wallet> {
    return this.remote.updateWallet(ownerId, walletId, dto);
  }

  setWalletArchived(
    ownerId: string,
    walletId: string,
    archivedAt: string | null,
  ): Promise<Wallet> {
    return this.remote.setWalletArchived(ownerId, walletId, archivedAt);
  }

  getWalletUsage(ownerId: string, walletId: string): Promise<WalletUsage> {
    return this.remote.getWalletUsage(ownerId, walletId);
  }

  deleteWallet(
    ownerId: string,
    walletId: string,
    options: DeleteWalletOptions,
  ): Promise<WalletDeletionResult> {
    return this.remote.deleteWallet(ownerId, walletId, options);
  }
}
