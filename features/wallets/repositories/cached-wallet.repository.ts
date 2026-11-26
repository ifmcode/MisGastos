import {
  CreateWalletDto,
  DefaultWalletSeedResult,
  DeleteWalletOptions,
  UpdateWalletDto,
  Wallet,
  WalletDeletionResult,
  WalletUsage,
} from "../types/wallet.types";
import { cacheWallets, readCachedWallets } from "./local-wallet.cache";
import { IWalletRepository } from "./wallet.repository";

/**
 * Read-through wallet repository. The list read mirrors the remote result with
 * the server balance and returns it with the pending outbox delta applied. When
 * the remote read fails and a cache exists, the derived cache is returned
 * instead of propagating the error.
 */
export class CachedWalletRepository implements IWalletRepository {
  constructor(private readonly remote: IWalletRepository) {}

  async getWallets(ownerId: string): Promise<Wallet[]> {
    let wallets: Wallet[];

    try {
      wallets = await this.remote.getWallets(ownerId);
    } catch (error) {
      const cached = await readCachedWallets(ownerId);
      if (cached) return cached;
      throw error;
    }

    try {
      await cacheWallets(ownerId, wallets, new Date().toISOString());
      // `readCachedWallets` already derives `serverBalance + delta`; applying
      // the delta again here would double it.
      const derived = await readCachedWallets(ownerId);
      if (derived) return derived;
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
