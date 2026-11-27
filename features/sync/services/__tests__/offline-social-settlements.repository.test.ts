import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { registerCurrentOwnerResolver } from "@/shared/lib/local-db/current-owner";
import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import type { NotificationWrite } from "@/features/notifications/types/notification.types";
import type { Settlement } from "@/features/settlements/types/settlement.types";
import type { GroupSettlement } from "@/features/group-expenses/types/group-settlement.types";
import { OfflineSettlementsRepository } from "@/features/settlements/repositories/offline-settlements.repository";
import {
  fromSettlementLocalRow,
  toSettlementLocalRow,
} from "@/features/settlements/repositories/local-settlement.mapper";
import { OfflineGroupSettlementsRepository } from "@/features/group-expenses/repositories/offline-group-settlements.repository";
import {
  fromGroupSettlementLocalRow,
  toGroupSettlementLocalRow,
} from "@/features/group-expenses/repositories/local-group-settlement.mapper";
import { buildSettlement } from "@/features/settlements/utils/__tests__/settlement.fixtures";
import { buildGroupSettlement } from "@/features/group-expenses/services/__tests__/group-settlements-service.fakes";

const OWNER = "user-a";
const NOW = "2026-11-26T10:00:00.000Z";

const notification: NotificationWrite = {
  userId: "user-b",
  type: "settlement-created",
  payload: { settlementId: "settlement-1" },
  dedupeKey: "settlement-1:created:user-b",
  createdAt: NOW,
};

function splitSettlement(settlement: Settlement) {
  const { id: _id, revision: _revision, ...dto } = settlement;
  return dto;
}

function splitGroupSettlement(settlement: GroupSettlement) {
  const { id: _id, revision: _revision, ...dto } = settlement;
  return dto;
}

function options(db: InMemoryDatabase) {
  let counter = 0;
  return {
    getPort: async () => db,
    now: () => NOW,
    createId: () => `id-${++counter}`,
  };
}

function settlementRemote() {
  return {
    getSettlement: jest.fn(async (_id: string) => null),
    getSettlements: jest.fn(async (_owner: string) => []),
    createSettlement: jest.fn(async (_dto: unknown, _n: unknown) =>
      buildSettlement(),
    ),
    updateSettlement: jest.fn(
      async (_v: string, _id: string, _u: unknown, _n: unknown) =>
        buildSettlement(),
    ),
    softDeleteSettlement: jest.fn(
      async (_v: string, _id: string, _d: string, _n: unknown) => {},
    ),
  };
}

function groupSettlementRemote() {
  return {
    getGroupSettlement: jest.fn(async (_id: string) => null),
    getGroupSettlements: jest.fn(async (_groupId: string) => []),
    createGroupSettlement: jest.fn(async (_dto: unknown, _n: unknown) =>
      buildGroupSettlement(),
    ),
    updateGroupSettlement: jest.fn(
      async (_v: string, _id: string, _u: unknown, _n: unknown) =>
        buildGroupSettlement(),
    ),
    softDeleteGroupSettlement: jest.fn(
      async (_v: string, _id: string, _d: string, _n: unknown) => {},
    ),
  };
}

async function outboxRows(db: InMemoryDatabase) {
  return db.select<LocalRow>("outbox");
}

beforeEach(() => {
  registerCurrentOwnerResolver(() => OWNER);
});

afterEach(() => {
  registerCurrentOwnerResolver(() => null);
});

describe("OfflineSettlementsRepository", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
  });

  it("creates the row and stores the notification for replay", async () => {
    const repository = new OfflineSettlementsRepository(
      settlementRemote() as never,
      options(db),
    );

    const settlement = await repository.createSettlement(
      splitSettlement(buildSettlement()) as never,
      () => notification,
    );

    expect(settlement).toMatchObject({ id: "id-1", revision: 0 });
    const rows = await outboxRows(db);
    expect(rows[0]).toMatchObject({
      entityType: "settlement",
      operation: "create",
    });
    expect(
      JSON.parse(String(rows[0]?.localSnapshot)).notification,
    ).toEqual(notification);
  });

  it("updates and deletes a cached settlement", async () => {
    const stored = buildSettlement({ revision: 2 });
    await db.upsert("settlements", toSettlementLocalRow(stored, OWNER));
    const repository = new OfflineSettlementsRepository(
      settlementRemote() as never,
      options(db),
    );

    await repository.updateSettlement(OWNER, "settlement-1", {
      amountCents: 400,
      date: "2026-11-12",
      note: "Paid",
      updatedAt: NOW,
      receiverWalletId: null,
      receiverCategoryId: null,
    }, notification);
    await repository.softDeleteSettlement(OWNER, "settlement-1", NOW, notification);

    const rows = await outboxRows(db);
    expect(rows[0]).toMatchObject({
      entityType: "settlement",
      operation: "delete",
      baseRevision: 2,
    });
  });

  it("delegates when there is no local port", async () => {
    const remote = settlementRemote();
    const repository = new OfflineSettlementsRepository(remote as never, {
      getPort: async () => null,
    });

    await repository.createSettlement(
      splitSettlement(buildSettlement()) as never,
      () => notification,
    );
    await repository.updateSettlement(
      OWNER,
      "settlement-1",
      {} as never,
      notification,
    );
    await repository.softDeleteSettlement(
      OWNER,
      "settlement-1",
      NOW,
      notification,
    );

    expect(remote.createSettlement).toHaveBeenCalled();
    expect(remote.softDeleteSettlement).toHaveBeenCalled();
  });

  it("round-trips the local mapper", () => {
    const settlement = buildSettlement({ revision: 4 });
    expect(
      fromSettlementLocalRow(toSettlementLocalRow(settlement, OWNER)),
    ).toEqual(settlement);
  });
});

describe("OfflineGroupSettlementsRepository", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
  });

  it("creates the row and stores the notification for replay", async () => {
    const repository = new OfflineGroupSettlementsRepository(
      groupSettlementRemote() as never,
      options(db),
    );

    const settlement = await repository.createGroupSettlement(
      splitGroupSettlement(buildGroupSettlement()) as never,
      () => notification,
    );

    expect(settlement).toMatchObject({ id: "id-1", revision: 0 });
    const rows = await outboxRows(db);
    expect(rows[0]).toMatchObject({
      entityType: "group-settlement",
      operation: "create",
    });
    expect(
      JSON.parse(String(rows[0]?.localSnapshot)).notification,
    ).toEqual(notification);
  });

  it("deletes a cached settlement and delegates a missing one", async () => {
    const stored = buildGroupSettlement();
    await db.upsert(
      "groupSettlements",
      toGroupSettlementLocalRow(stored, OWNER),
    );
    const remote = groupSettlementRemote();
    const repository = new OfflineGroupSettlementsRepository(
      remote as never,
      options(db),
    );

    await repository.softDeleteGroupSettlement(
      OWNER,
      "group-settlement-1",
      NOW,
      notification,
    );
    await repository.softDeleteGroupSettlement(
      OWNER,
      "missing",
      NOW,
      notification,
    );

    expect(remote.softDeleteGroupSettlement).toHaveBeenCalledWith(
      OWNER,
      "missing",
      NOW,
      notification,
    );
    expect((await outboxRows(db))[0]).toMatchObject({
      entityType: "group-settlement",
      operation: "delete",
    });
  });

  it("delegates when there is no local port", async () => {
    const remote = groupSettlementRemote();
    const repository = new OfflineGroupSettlementsRepository(remote as never, {
      getPort: async () => null,
    });

    await repository.createGroupSettlement(
      splitGroupSettlement(buildGroupSettlement()) as never,
      () => notification,
    );
    await repository.updateGroupSettlement(
      OWNER,
      "group-settlement-1",
      {} as never,
      notification,
    );
    await repository.softDeleteGroupSettlement(
      OWNER,
      "group-settlement-1",
      NOW,
      notification,
    );

    expect(remote.createGroupSettlement).toHaveBeenCalled();
    expect(remote.softDeleteGroupSettlement).toHaveBeenCalled();
  });

  it("round-trips the local mapper", () => {
    const settlement = buildGroupSettlement({ revision: 1 });
    expect(
      fromGroupSettlementLocalRow(
        toGroupSettlementLocalRow(settlement, OWNER),
      ),
    ).toEqual(settlement);
  });
});
