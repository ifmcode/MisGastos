import { IWalletRepository } from "@/features/wallets/repositories/wallet.repository";
import {
  CreateWalletDto,
  Wallet,
} from "@/features/wallets/types/wallet.types";

import {
  ITransferRepository,
  TransferMutationResult,
} from "../../repositories/transfer.repository";
import { CreateTransferDto, Transfer } from "../../types/transfer.types";

export class FakeWalletRepository implements IWalletRepository {
  readonly getCalls: string[] = [];
  wallets: Wallet[] = [];
  failure: Error | null = null;

  async getWallets(ownerId: string): Promise<Wallet[]> {
    this.getCalls.push(ownerId);
    if (this.failure) throw this.failure;
    return this.wallets;
  }

  async createWallet(
    _ownerId: string,
    _dto: CreateWalletDto,
  ): Promise<Wallet> {
    throw new Error("Not used in transfer tests");
  }
}

export class FakeTransferRepository implements ITransferRepository {
  readonly getCalls: string[] = [];
  readonly getTransferCalls: Array<{
    ownerId: string;
    transferId: string;
  }> = [];
  readonly createCalls: Array<{
    ownerId: string;
    dto: CreateTransferDto;
  }> = [];
  readonly updateCalls: Array<{
    ownerId: string;
    transferId: string;
    dto: CreateTransferDto;
  }> = [];
  readonly deleteCalls: Array<{
    ownerId: string;
    transferId: string;
  }> = [];
  transfers: Transfer[] = [];
  transferById: Transfer | null = null;
  failure: Error | null = null;

  async getTransfers(ownerId: string): Promise<Transfer[]> {
    this.getCalls.push(ownerId);
    if (this.failure) throw this.failure;
    return this.transfers;
  }

  async getTransfer(
    ownerId: string,
    transferId: string,
  ): Promise<Transfer | null> {
    this.getTransferCalls.push({ ownerId, transferId });
    if (this.failure) throw this.failure;

    return this.transferById?.id === transferId && !this.transferById.deletedAt
      ? this.transferById
      : null;
  }

  async createTransfer(
    ownerId: string,
    dto: CreateTransferDto,
  ): Promise<TransferMutationResult> {
    this.createCalls.push({ ownerId, dto });
    if (this.failure) throw this.failure;

    const transfer: Transfer = {
      ...dto,
      id: `transfer-${this.createCalls.length}`,
      ownerId,
      createdAt: "2026-10-29T10:00:00.000Z",
      updatedAt: "2026-10-29T10:00:00.000Z",
    };

    return { transfer, wallets: [] };
  }

  async updateTransfer(
    ownerId: string,
    transferId: string,
    dto: CreateTransferDto,
  ): Promise<TransferMutationResult> {
    this.updateCalls.push({ ownerId, transferId, dto });
    if (this.failure) throw this.failure;

    return {
      transfer: {
        ...dto,
        id: transferId,
        ownerId,
        createdAt:
          this.transferById?.createdAt ?? "2026-10-29T10:00:00.000Z",
        updatedAt: "2026-10-29T11:00:00.000Z",
      },
      wallets: [],
    };
  }

  async deleteTransfer(
    ownerId: string,
    transferId: string,
  ): Promise<TransferMutationResult> {
    this.deleteCalls.push({ ownerId, transferId });
    if (this.failure) throw this.failure;

    const previous = this.transferById;

    return {
      transfer: {
        ...(previous ?? {
          id: transferId,
          fromWalletId: "wallet-1",
          toWalletId: "wallet-2",
          amount: 0,
          currency: "EUR",
          date: "",
          ownerId,
          createdAt: "2026-10-29T10:00:00.000Z",
          updatedAt: "2026-10-29T10:00:00.000Z",
        }),
        id: transferId,
        ownerId,
        deletedAt: "2026-10-29T11:00:00.000Z",
        updatedAt: "2026-10-29T11:00:00.000Z",
      },
      wallets: [],
    };
  }
}
