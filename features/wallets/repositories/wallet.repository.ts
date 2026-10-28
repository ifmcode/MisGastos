import {
  CreateWalletDto,
  Wallet,
} from "../types/wallet.types";

export interface IWalletRepository {
  getWallets(ownerId: string): Promise<Wallet[]>;
  createWallet(ownerId: string, dto: CreateWalletDto): Promise<Wallet>;
}
