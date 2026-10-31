import { IWalletRepository } from "../../repositories/wallet.repository";
import { CreateWalletDto, Wallet } from "../../types/wallet.types";

export class FakeWalletRepository implements IWalletRepository {
  readonly getCalls: string[] = [];
  readonly createCalls: Array<{ ownerId: string; dto: CreateWalletDto }> = [];
  wallets: Wallet[] = [];
  failure: Error | null = null;

  async getWallets(ownerId: string): Promise<Wallet[]> {
    this.getCalls.push(ownerId);
    if (this.failure) throw this.failure;
    return this.wallets;
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
}
