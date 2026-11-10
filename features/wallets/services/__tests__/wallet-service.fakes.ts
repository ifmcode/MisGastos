import { IWalletRepository } from "../../repositories/wallet.repository";
import { WalletOperationError } from "../wallet.errors";
import {
  CreateWalletDto,
  DeleteWalletOptions,
  UpdateWalletDto,
  Wallet,
  WalletDeletionResult,
  WalletUsage,
} from "../../types/wallet.types";

export class FakeWalletRepository implements IWalletRepository {
  readonly getCalls: string[] = [];
  readonly createCalls: Array<{ ownerId: string; dto: CreateWalletDto }> = [];
  readonly updateCalls: Array<{
    ownerId: string;
    walletId: string;
    dto: UpdateWalletDto;
  }> = [];
  readonly archiveCalls: Array<{
    ownerId: string;
    walletId: string;
    archivedAt: string | null;
  }> = [];
  readonly deleteCalls: Array<{
    ownerId: string;
    walletId: string;
    options: DeleteWalletOptions;
  }> = [];
  readonly usageCalls: Array<{ ownerId: string; walletId: string }> = [];
  wallets: Wallet[] = [];
  usage: WalletUsage = {
    transactionCount: 0,
    transferCount: 0,
    hasMovements: false,
  };
  deletionResult: WalletDeletionResult | null = null;
  failure: Error | null = null;

  async getWallets(ownerId: string): Promise<Wallet[]> {
    this.getCalls.push(ownerId);
    if (this.failure) throw this.failure;
    return this.wallets;
  }

  async getWallet(ownerId: string, walletId: string): Promise<Wallet | null> {
    if (this.failure) throw this.failure;

    return (
      this.wallets.find(
        (wallet) => wallet.id === walletId && wallet.ownerId === ownerId,
      ) ?? null
    );
  }

  async createWallet(
    ownerId: string,
    dto: CreateWalletDto,
  ): Promise<Wallet> {
    this.createCalls.push({ ownerId, dto });
    if (this.failure) throw this.failure;

    const wallet: Wallet = {
      ...dto,
      id: `wallet-${this.createCalls.length}`,
      balance: dto.initialBalance,
      ownerId,
      createdAt: "2026-10-28T10:00:00.000Z",
      updatedAt: "2026-10-28T10:00:00.000Z",
    };

    this.wallets = [wallet, ...this.wallets];
    return wallet;
  }

  async updateWallet(
    ownerId: string,
    walletId: string,
    dto: UpdateWalletDto,
  ): Promise<Wallet> {
    this.updateCalls.push({ ownerId, walletId, dto });
    if (this.failure) throw this.failure;

    const existing = await this.getWallet(ownerId, walletId);
    if (!existing) throw new WalletOperationError("WALLET_NOT_FOUND");

    const updated: Wallet = {
      ...existing,
      ...dto,
      balance:
        dto.initialBalance !== undefined ? dto.initialBalance : existing.balance,
      updatedAt: "2026-10-29T10:00:00.000Z",
    };

    this.wallets = this.wallets.map((wallet) =>
      wallet.id === walletId ? updated : wallet,
    );
    return updated;
  }

  async setWalletArchived(
    ownerId: string,
    walletId: string,
    archivedAt: string | null,
  ): Promise<Wallet> {
    this.archiveCalls.push({ ownerId, walletId, archivedAt });
    if (this.failure) throw this.failure;

    const existing = await this.getWallet(ownerId, walletId);
    if (!existing) throw new WalletOperationError("WALLET_NOT_FOUND");

    const updated: Wallet = { ...existing, updatedAt: "2026-10-29T10:00:00.000Z" };
    if (archivedAt) {
      updated.archivedAt = archivedAt;
    } else {
      delete updated.archivedAt;
    }

    this.wallets = this.wallets.map((wallet) =>
      wallet.id === walletId ? updated : wallet,
    );
    return updated;
  }

  async getWalletUsage(
    ownerId: string,
    walletId: string,
  ): Promise<WalletUsage> {
    this.usageCalls.push({ ownerId, walletId });
    if (this.failure) throw this.failure;
    return this.usage;
  }

  async deleteWallet(
    ownerId: string,
    walletId: string,
    options: DeleteWalletOptions,
  ): Promise<WalletDeletionResult> {
    this.deleteCalls.push({ ownerId, walletId, options });
    if (this.failure) throw this.failure;

    this.wallets = this.wallets.filter((wallet) => wallet.id !== walletId);
    return this.deletionResult ?? { deletedWalletId: walletId };
  }
}
