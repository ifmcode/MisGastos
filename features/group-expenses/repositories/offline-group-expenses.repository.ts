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
  CreateGroupExpenseDto,
  GroupExpense,
  UpdateGroupExpenseDto,
} from "../types/group-expense.types";
import {
  fromGroupExpenseLocalRow,
  toGroupExpenseLocalRow,
} from "./local-group-expense.mapper";
import type {
  IGroupExpensesRepository,
  IGroupExpenseLinkRepository,
} from "./group-expenses.repository";

export interface OfflineGroupExpensesOptions {
  getPort?: () => Promise<DatabasePort | null>;
  now?: () => string;
  createId?: () => string;
}

async function readRow(
  port: DatabasePort,
  ownerId: string,
  expenseId: string,
): Promise<GroupExpense | null> {
  const rows = await port.select<LocalRow>("groupExpenses", {
    where: { id: expenseId, ownerId },
    limit: 1,
  });

  return rows[0] ? fromGroupExpenseLocalRow(rows[0]) : null;
}

/**
 * Local-first group expenses. The group ledger and the shares live in the
 * record itself, so the offline write is the same document the online path
 * stores; the optional personal movement is replayed by the executor.
 */
export class OfflineGroupExpensesRepository
  implements IGroupExpensesRepository, IGroupExpenseLinkRepository
{
  private readonly getPort: () => Promise<DatabasePort | null>;
  private readonly now: () => string;
  private readonly createId: () => string;

  constructor(
    private readonly reader: IGroupExpensesRepository &
      IGroupExpenseLinkRepository,
    options: OfflineGroupExpensesOptions = {},
  ) {
    this.getPort = options.getPort ?? getLocalDatabase;
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? createClientId;
  }

  getExpense(expenseId: string): Promise<GroupExpense | null> {
    return this.reader.getExpense(expenseId);
  }

  getGroupExpenses(groupId: string): Promise<GroupExpense[]> {
    return this.reader.getGroupExpenses(groupId);
  }

  async createExpense(dto: CreateGroupExpenseDto): Promise<GroupExpense> {
    const port = await this.getPort();
    if (!port) return this.reader.createExpense(dto);

    return this.create(port, dto);
  }

  async createExpenseLink(dto: CreateGroupExpenseDto): Promise<GroupExpense> {
    const port = await this.getPort();
    if (!port) return this.reader.createExpenseLink(dto);

    return this.create(port, dto);
  }

  async updateExpense(
    expenseId: string,
    update: UpdateGroupExpenseDto,
    viewerUid: string,
  ): Promise<GroupExpense> {
    const port = await this.getPort();
    if (!port) return this.reader.updateExpense(expenseId, update, viewerUid);

    const stored = await readRow(port, viewerUid, expenseId);
    if (!stored) {
      return this.reader.updateExpense(expenseId, update, viewerUid);
    }

    return this.writeUpdate(port, stored, update, viewerUid);
  }

  async updateExpenseLink(
    viewerUid: string,
    expenseId: string,
    update: UpdateGroupExpenseDto,
  ): Promise<GroupExpense> {
    const port = await this.getPort();
    if (!port) {
      return this.reader.updateExpenseLink(viewerUid, expenseId, update);
    }

    const stored = await readRow(port, viewerUid, expenseId);
    if (!stored) {
      return this.reader.updateExpenseLink(viewerUid, expenseId, update);
    }

    return this.writeUpdate(port, stored, update, viewerUid);
  }

  async softDeleteExpense(
    expenseId: string,
    deletedAt: string,
    viewerUid: string,
  ): Promise<void> {
    const port = await this.getPort();
    if (!port) {
      return this.reader.softDeleteExpense(expenseId, deletedAt, viewerUid);
    }

    await this.remove(port, expenseId, deletedAt, viewerUid);
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

    await this.remove(port, expenseId, deletedAt, viewerUid);
  }

  private create(
    port: DatabasePort,
    dto: CreateGroupExpenseDto,
  ): Promise<GroupExpense> {
    const entity: GroupExpense = {
      id: this.createId(),
      ...dto,
      revision: INITIAL_REVISION,
    };

    return writeSocialCreate({
      port,
      ownerId: entity.createdBy,
      entity,
      entityType: "group-expense",
      table: "groupExpenses",
      toRow: toGroupExpenseLocalRow,
      fromRow: fromGroupExpenseLocalRow,
      snapshot: (value) => ({ ...value }),
      createId: this.createId,
      now: this.now(),
    });
  }

  private writeUpdate(
    port: DatabasePort,
    stored: GroupExpense,
    update: UpdateGroupExpenseDto,
    viewerUid: string,
  ): Promise<GroupExpense> {
    return writeSocialUpdate({
      port,
      ownerId: viewerUid,
      entityId: stored.id,
      entity: applyUpdate(stored, update),
      entityType: "group-expense",
      table: "groupExpenses",
      toRow: toGroupExpenseLocalRow,
      fromRow: fromGroupExpenseLocalRow,
      snapshot: (value) => ({ ...value }),
      createId: this.createId,
      now: this.now(),
    });
  }

  private async remove(
    port: DatabasePort,
    expenseId: string,
    deletedAt: string,
    viewerUid: string,
  ): Promise<void> {
    const stored = await readRow(port, viewerUid, expenseId);
    if (!stored) return;

    await writeSocialDelete({
      port,
      ownerId: viewerUid,
      entityId: expenseId,
      entity: { ...stored, deletedAt, updatedAt: deletedAt },
      entityType: "group-expense",
      table: "groupExpenses",
      toRow: toGroupExpenseLocalRow,
      fromRow: fromGroupExpenseLocalRow,
      snapshot: (value) => ({ ...value }),
      createId: this.createId,
      now: this.now(),
    });
  }
}

function applyUpdate(
  stored: GroupExpense,
  update: UpdateGroupExpenseDto,
): GroupExpense {
  return {
    ...stored,
    ...update,
    linkedTransactionId:
      update.linkedTransactionId !== undefined
        ? update.linkedTransactionId
        : stored.linkedTransactionId,
  };
}
