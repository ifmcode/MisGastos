import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import { createClientId } from "@/shared/utils/client-id";

import type {
  CreateTransferDto,
  Transfer,
  UpdateTransferDto,
} from "../types/transfer.types";
import { fromTransferLocalRow } from "./local-transfer.mapper";
import { createOfflineTransfer } from "./offline-transfer.create";
import { deleteOfflineTransfer } from "./offline-transfer.delete";
import { readTransferRow } from "./offline-transfer.rows";
import { updateOfflineTransfer } from "./offline-transfer.update";
import {
  ITransferRepository,
  TransferMutationResult,
} from "./transfer.repository";

export interface OfflineTransferRepositoryOptions {
  /** Local port provider; defaults to the runtime database. */
  getPort?: () => Promise<DatabasePort | null>;
  now?: () => string;
  createId?: () => string;
}

/**
 * Local-first transfer repository used while `EXPO_PUBLIC_OFFLINE_FIRST` is on.
 * The list read stays on the phase-3 cached repository; `getTransfer` prefers a
 * local row so a transfer created offline can be edited or deleted, and
 * mutations fall back to the remote path without a local port or local row.
 */
export class OfflineTransferRepository implements ITransferRepository {
  private readonly getPort: () => Promise<DatabasePort | null>;
  private readonly now: () => string;
  private readonly createId: () => string;

  constructor(
    private readonly reader: ITransferRepository,
    options: OfflineTransferRepositoryOptions = {},
  ) {
    this.getPort = options.getPort ?? getLocalDatabase;
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? createClientId;
  }

  getTransfers(ownerId: string): Promise<Transfer[]> {
    return this.reader.getTransfers(ownerId);
  }

  async getTransfer(
    ownerId: string,
    transferId: string,
  ): Promise<Transfer | null> {
    const port = await this.getPort();
    if (!port) return this.reader.getTransfer(ownerId, transferId);

    const row = await readTransferRow(port, ownerId, transferId);
    if (!row) return this.reader.getTransfer(ownerId, transferId);

    const transfer = fromTransferLocalRow(row);
    return transfer && !transfer.deletedAt ? transfer : null;
  }

  async createTransfer(
    ownerId: string,
    dto: CreateTransferDto,
  ): Promise<TransferMutationResult> {
    const port = await this.getPort();
    if (!port) return this.reader.createTransfer(ownerId, dto);

    return createOfflineTransfer(port, ownerId, dto, this.deps());
  }

  async updateTransfer(
    ownerId: string,
    transferId: string,
    dto: UpdateTransferDto,
  ): Promise<TransferMutationResult> {
    const port = await this.getPort();
    if (!port) {
      return this.reader.updateTransfer(ownerId, transferId, dto);
    }

    const existing = await readTransferRow(port, ownerId, transferId);
    if (!existing) {
      return this.reader.updateTransfer(ownerId, transferId, dto);
    }

    return updateOfflineTransfer(port, ownerId, transferId, dto, this.deps());
  }

  async deleteTransfer(
    ownerId: string,
    transferId: string,
  ): Promise<TransferMutationResult> {
    const port = await this.getPort();
    if (!port) {
      return this.reader.deleteTransfer(ownerId, transferId);
    }

    const existing = await readTransferRow(port, ownerId, transferId);
    if (!existing) {
      return this.reader.deleteTransfer(ownerId, transferId);
    }

    return deleteOfflineTransfer(port, ownerId, transferId, this.deps());
  }

  private deps(): { now: () => string; createId: () => string } {
    return { now: this.now, createId: this.createId };
  }
}
