import { Wallet } from "@/features/wallets/types/wallet.types";

import {
  CreateTransferDto,
  Transfer,
  UpdateTransferDto,
} from "../types/transfer.types";

export interface TransferMutationResult {
  transfer: Transfer;
  /** Wallets whose balance changed, so callers can refresh their local state. */
  wallets: Wallet[];
}

export interface ITransferRepository {
  getTransfers(ownerId: string): Promise<Transfer[]>;
  getTransfer(ownerId: string, transferId: string): Promise<Transfer | null>;
  createTransfer(
    ownerId: string,
    dto: CreateTransferDto,
  ): Promise<TransferMutationResult>;
  updateTransfer(
    ownerId: string,
    transferId: string,
    dto: UpdateTransferDto,
  ): Promise<TransferMutationResult>;
  deleteTransfer(
    ownerId: string,
    transferId: string,
  ): Promise<TransferMutationResult>;
}
