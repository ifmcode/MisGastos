import {
  CreateTransferDto,
  Transfer,
  UpdateTransferDto,
} from "../types/transfer.types";
import { cacheTransfer, cacheTransfers } from "./local-transfer.cache";
import {
  ITransferRepository,
  TransferMutationResult,
} from "./transfer.repository";

/**
 * Read-through transfer repository. Every method delegates to the remote
 * implementation; the list read mirrors the collection and each successful
 * mutation mirrors its single record. Cache failures never fail the online
 * operation.
 */
export class CachedTransferRepository implements ITransferRepository {
  constructor(private readonly remote: ITransferRepository) {}

  async getTransfers(ownerId: string): Promise<Transfer[]> {
    const transfers = await this.remote.getTransfers(ownerId);

    try {
      await cacheTransfers(ownerId, transfers, new Date().toISOString());
    } catch {
      // Best effort: the online read already succeeded.
    }

    return transfers;
  }

  getTransfer(ownerId: string, transferId: string): Promise<Transfer | null> {
    return this.remote.getTransfer(ownerId, transferId);
  }

  async createTransfer(
    ownerId: string,
    dto: CreateTransferDto,
  ): Promise<TransferMutationResult> {
    const result = await this.remote.createTransfer(ownerId, dto);
    await this.mirrorSingle(ownerId, result.transfer);
    return result;
  }

  async updateTransfer(
    ownerId: string,
    transferId: string,
    dto: UpdateTransferDto,
  ): Promise<TransferMutationResult> {
    const result = await this.remote.updateTransfer(ownerId, transferId, dto);
    await this.mirrorSingle(ownerId, result.transfer);
    return result;
  }

  async deleteTransfer(
    ownerId: string,
    transferId: string,
  ): Promise<TransferMutationResult> {
    const result = await this.remote.deleteTransfer(ownerId, transferId);
    // The delete result carries `deletedAt`; the cached read filters it out, so
    // there is no physical removal to schedule here.
    await this.mirrorSingle(ownerId, result.transfer);
    return result;
  }

  private async mirrorSingle(
    ownerId: string,
    transfer: Transfer,
  ): Promise<void> {
    try {
      await cacheTransfer(ownerId, transfer, new Date().toISOString());
    } catch {
      // Best effort: the online mutation already succeeded.
    }
  }
}
