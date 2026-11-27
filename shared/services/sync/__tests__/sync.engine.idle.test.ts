import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import { NOW } from "@/shared/lib/local-db/__tests__/outbox.fixtures";
import {
  allowOwnerLocalWrites,
  revokeOwnerLocalWrites,
} from "@/shared/lib/local-db/owner-revocation";
import type { SyncMutationApplier } from "@/shared/services/sync/sync.applier.types";
import type { RemoteMutationExecutor } from "@/shared/services/sync/sync.types";

import { SyncEngine } from "../sync.engine";
import type { SyncEngineDependencies } from "../sync.engine";

const OWNER = "owner-1";

type Input = {
  getPort?: SyncEngineDependencies["getPort"];
  pull?: SyncEngineDependencies["pull"];
};

function createEngine({ getPort, pull }: Input = {}) {
  const db = new InMemoryDatabase();
  const pullMock =
    pull ?? jest.fn<(ownerId: string) => Promise<void>>(async () => undefined);
  const execute = jest.fn<RemoteMutationExecutor["execute"]>();

  const engine = new SyncEngine({
    getPort: getPort ?? (async () => db),
    now: () => NOW,
    executor: { execute },
    applier: {
      applySuccess: jest.fn<SyncMutationApplier["applySuccess"]>(),
      applyConflict: jest.fn<SyncMutationApplier["applyConflict"]>(),
      applyFailure: jest.fn<SyncMutationApplier["applyFailure"]>(),
    },
    pull: pullMock,
  });

  return { engine, db, pull: pullMock, execute };
}

afterEach(() => {
  allowOwnerLocalWrites(OWNER);
});

describe("SyncEngine.whenIdle", () => {
  it("resolves immediately without an active cycle", async () => {
    const context = createEngine();

    await expect(context.engine.whenIdle(OWNER)).resolves.toBeUndefined();
    expect(context.pull).not.toHaveBeenCalled();
  });

  it("waits for the active cycle to finish", async () => {
    let releasePull: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      releasePull = resolve;
    });
    const context = createEngine({
      pull: async () => {
        await gate;
      },
    });

    const cycle = context.engine.sync(OWNER);
    const idle = context.engine.whenIdle(OWNER);
    const settled: string[] = [];
    void cycle.then(() => settled.push("cycle"));
    void idle.then(() => settled.push("idle"));

    await Promise.resolve();
    expect(settled).toEqual([]);

    releasePull();
    await idle;

    expect(settled).toEqual(["cycle", "idle"]);
    await expect(cycle).resolves.toMatchObject({ pulled: true });
  });

  it("does not propagate the failure of the finished cycle", async () => {
    const context = createEngine({
      getPort: async () => {
        throw new Error("port failed");
      },
    });

    const cycle = context.engine.sync(OWNER);
    const idle = context.engine.whenIdle(OWNER);

    await expect(idle).resolves.toBeUndefined();
    await expect(cycle).rejects.toThrow("port failed");
  });
});

describe("SyncEngine with a revoked owner", () => {
  it("never opens the port or the executor while the writes are revoked", async () => {
    revokeOwnerLocalWrites(OWNER);
    const getPort = jest.fn<SyncEngineDependencies["getPort"]>(
      async () => new InMemoryDatabase(),
    );
    const context = createEngine({ getPort });

    await expect(context.engine.sync(OWNER)).resolves.toMatchObject({
      status: "offline",
      errorCode: null,
      pushed: 0,
      pulled: false,
      pending: 0,
    });

    expect(getPort).not.toHaveBeenCalled();
    expect(context.execute).not.toHaveBeenCalled();
    expect(context.pull).not.toHaveBeenCalled();
  });

  it("resumes syncing once the account lifts the revocation", async () => {
    revokeOwnerLocalWrites(OWNER);
    const context = createEngine();

    await context.engine.sync(OWNER);
    expect(context.pull).not.toHaveBeenCalled();

    allowOwnerLocalWrites(OWNER);

    await expect(context.engine.sync(OWNER)).resolves.toMatchObject({
      status: "done",
      pulled: true,
    });
    expect(context.pull).toHaveBeenCalledWith(OWNER);
  });
});
