import {
  CreateWalletDto,
  DeleteWalletOptions,
  UpdateWalletDto,
  Wallet,
  WalletDeletionResult,
  WalletUsage,
} from "../types/wallet.types";

export interface IWalletRepository {
  getWallets(ownerId: string): Promise<Wallet[]>;
  getWallet(ownerId: string, walletId: string): Promise<Wallet | null>;
  createWallet(ownerId: string, dto: CreateWalletDto): Promise<Wallet>;
  updateWallet(
    ownerId: string,
    walletId: string,
    dto: UpdateWalletDto,
  ): Promise<Wallet>;
  setWalletArchived(
    ownerId: string,
    walletId: string,
    archivedAt: string | null,
  ): Promise<Wallet>;
  getWalletUsage(ownerId: string, walletId: string): Promise<WalletUsage>;
  deleteWallet(
    ownerId: string,
    walletId: string,
    options: DeleteWalletOptions,
  ): Promise<WalletDeletionResult>;
}
