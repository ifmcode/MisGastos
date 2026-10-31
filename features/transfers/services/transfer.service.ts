import { IWalletRepository } from "@/features/wallets/repositories/wallet.repository";

import { ITransferRepository } from "../repositories/transfer.repository";
import { TransferInput } from "../schemas/transfer.schema";
import { Transfer } from "../types/transfer.types";
import { TransferOperationError } from "./transfer.errors";
import {
  ensureTransferWallets,
  requireOwnerId,
  validateTransferRequest,
} from "./transfer-validation";

export class TransferService {
  constructor(
    private readonly transferRepository: ITransferRepository,
    private readonly walletRepository: IWalletRepository,
  ) {}

  async getTransfers(ownerId: string): Promise<Transfer[]> {
    return this.transferRepository.getTransfers(requireOwnerId(ownerId));
  }

  async createTransfer(ownerId: string, input: TransferInput) {
    const request = validateTransferRequest(ownerId, input);
    const wallets = await this.walletRepository.getWallets(request.ownerId);

    ensureTransferWallets({ wallets, value: request.value });

    return this.transferRepository.createTransfer(
      request.ownerId,
      request.value,
    );
  }

  async updateTransfer(
    ownerId: string,
    transferId: string,
    input: TransferInput,
  ) {
    const request = validateTransferRequest(ownerId, input);
    const normalizedTransferId = transferId.trim();

    if (normalizedTransferId.length === 0) {
      throw new TransferOperationError("TRANSFER_NOT_FOUND");
    }

    const existing = await this.transferRepository.getTransfer(
      request.ownerId,
      normalizedTransferId,
    );

    if (!existing || existing.deletedAt) {
      throw new TransferOperationError("TRANSFER_NOT_FOUND");
    }

    const wallets = await this.walletRepository.getWallets(request.ownerId);

    ensureTransferWallets({
      wallets,
      value: request.value,
      previous: existing,
    });

    return this.transferRepository.updateTransfer(
      request.ownerId,
      normalizedTransferId,
      request.value,
    );
  }

  async deleteTransfer(ownerId: string, transferId: string) {
    const normalizedOwnerId = requireOwnerId(ownerId);
    const normalizedTransferId = transferId.trim();

    if (normalizedTransferId.length === 0) {
      throw new TransferOperationError("TRANSFER_NOT_FOUND");
    }

    return this.transferRepository.deleteTransfer(
      normalizedOwnerId,
      normalizedTransferId,
    );
  }
}
