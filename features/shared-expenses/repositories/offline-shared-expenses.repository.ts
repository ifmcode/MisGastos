import { readCurrentOwnerId } from "@/shared/lib/local-db/current-owner";
import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import {
  writeSocialCreate,
  writeSocialDelete,
  writeSocialUpdate,
} from "@/shared/lib/local-db/social-write";
import { createClientId } from "@/shared/utils/client-id";
import { INITIAL_REVISION } from "@/shared/utils/revision";

import type {
  CreateSharedExpenseDto,
  SharedExpense,
  UpdateSharedExpenseDto,
} from "../types/shared-expense.types";
import {
  fromSharedExpenseLocalRow,
  toSharedExpenseLocalRow,
} from "./local-shared-expense.mapper";
import type {
  ISharedExpensesRepository,
  ISharedExpenseLinkRepository,
} from "./shared-expenses.repository";

export interface OfflineSharedExpensesOptions {
  getPort?: () => Promise<DatabasePort | null>;
  now?: () => string;
  createId?: () => string;
}

async function readRow(
  port: DatabasePort,
  ownerId: string,
  expenseId: string,
): Promise<SharedExpense | null> {
  const rows = await port.select<LocalRow>("sharedExpenses", {
    where: { id: expenseId, ownerId },
    limit: 1,
  });

  return rows[0] ? fromSharedExpenseLocalRow(rows[0]) : null;
}

/**
 * Local-first 1:1 expenses used while `EXPO_PUBLIC_OFFLINE_FIRST` is on. Reads
 * delegate to the cached/remote implementation; mutations write the record and
 * one coalesced outbox row in a single local transaction. A record that is not
 * cached is edited through the online path instead.
 */
export class OfflineSharedExpensesRepository
  implements ISharedExpensesRepository, ISharedExpenseLinkRepository
{
  private readonly getPort: () => Promise<DatabasePort | null>;
  private readonly now: () => string;
  private readonly createId: () => string;

  constructor(
    private readonly reader: ISharedExpensesRepository &
      ISharedExpenseLinkRepository,
    options: OfflineSharedExpensesOptions = {},
  ) {
    this.getPort = options.getPort ?? getLocalDatabase;
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? createClientId;
  }

  getExpense(expenseId: string): Promise<SharedExpense | null> {
    return this.reader.getExpense(expenseId);
  }

  getExpenses(viewerUid: string): Promise<SharedExpense[]> {
    return this.reader.getExpenses(viewerUid);
  }

  async createExpense(dto: CreateSharedExpenseDto): Promise<SharedExpense> {
    const port = await this.getPort();
    if (!port) return this.reader.createExpense(dto);

    return this.create(port, dto);
  }

  async createExpenseLink(
    dto: CreateSharedExpenseDto,
  ): Promise<SharedExpense> {
    const port = await this.getPort();
    if (!port) return this.reader.createExpenseLink(dto);

    return this.create(port, dto);
  }

  async updateExpense(
    expenseId: string,
    update: UpdateSharedExpenseDto,
  ): Promise<SharedExpense> {
    const port = await this.getPort();
    if (!port) return this.reader.updateExpense(expenseId, update);

    const stored = await readRow(port, this.ownerId(), expenseId);
    if (!stored) return this.reader.updateExpense(expenseId, update);

    return this.writeUpdate(port, stored, update);
  }

  async updateExpenseLink(
    viewerUid: string,
    expenseId: string,
    update: UpdateSharedExpenseDto,
  ): Promise<SharedExpense> {
    const port = await this.getPort();
    if (!port) {
      return this.reader.updateExpenseLink(viewerUid, expenseId, update);
    }

    const stored = await readRow(port, viewerUid, expenseId);
    if (!stored) {
      return this.reader.updateExpenseLink(viewerUid, expenseId, update);
    }

    return this.writeUpdate(port, stored, update);
  }

  async softDeleteExpense(expenseId: string, deletedAt: string): Promise<void> {
    const port = await this.getPort();
    if (!port) return this.reader.softDeleteExpense(expenseId, deletedAt);

    await this.remove(port, expenseId, deletedAt);
  }

  async softDeleteExpenseLink(
    viewerUid: string,
    expenseId: string,
    deletedAt: string,
  ): Promise<void> {
    const port = await this.getPort();
    if (!port) {
      return this.reader.softDeleteExpenseLink(viewerUid, expenseId, deletedAt);
    }

    await this.remove(port, expenseId, deletedAt);
  }

  private create(
    port: DatabasePort,
    dto: CreateSharedExpenseDto,
  ): Promise<SharedExpense> {
    const entity: SharedExpense = {
      id: this.createId(),
      ...dto,
      revision: INITIAL_REVISION,
    };

    return writeSocialCreate({
      port,
      ownerId: entity.createdBy,
      entity,
      entityType: "shared-expense",
      table: "sharedExpenses",
      toRow: toSharedExpenseLocalRow,
      fromRow: fromSharedExpenseLocalRow,
      snapshot: (value) => ({ ...value }),
      createId: this.createId,
      now: this.now(),
    });
  }

  private writeUpdate(
    port: DatabasePort,
    stored: SharedExpense,
    update: UpdateSharedExpenseDto,
  ): Promise<SharedExpense> {
    const ownerId = this.ownerId();

    return writeSocialUpdate({
      port,
      ownerId,
      entityId: stored.id,
      entity: applyUpdate(stored, update),
      entityType: "shared-expense",
      table: "sharedExpenses",
      toRow: toSharedExpenseLocalRow,
      fromRow: fromSharedExpenseLocalRow,
      snapshot: (value) => ({ ...value }),
      createId: this.createId,
      now: this.now(),
    });
  }

  private async remove(
    port: DatabasePort,
    expenseId: string,
    deletedAt: string,
  ): Promise<void> {
    const ownerId = this.ownerId();
    const stored = await readRow(port, ownerId, expenseId);
    if (!stored) return;

    await writeSocialDelete({
      port,
      ownerId,
      entityId: expenseId,
      entity: { ...stored, deletedAt, updatedAt: deletedAt },
      entityType: "shared-expense",
      table: "sharedExpenses",
      toRow: toSharedExpenseLocalRow,
      fromRow: fromSharedExpenseLocalRow,
      snapshot: (value) => ({ ...value }),
      createId: this.createId,
      now: this.now(),
    });
  }

  private ownerId(): string {
    return readCurrentOwnerId() ?? "";
  }
}

function applyUpdate(
  stored: SharedExpense,
  update: UpdateSharedExpenseDto,
): SharedExpense {
  return {
    ...stored,
    ...update,
    linkedTransactionId:
      update.linkedTransactionId !== undefined
        ? update.linkedTransactionId
        : stored.linkedTransactionId,
  };
}
