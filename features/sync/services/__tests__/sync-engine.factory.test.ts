import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("@/lib/firebase", () => ({ db: { name: "test-db" }, auth: {} }));

import { getSyncEngine, resetSyncEngine } from "../sync-engine.factory";

beforeEach(resetSyncEngine);

describe("getSyncEngine", () => {
  it("returns one memoized engine", () => {
    const first = getSyncEngine();
    const second = getSyncEngine();

    expect(first).toBe(second);
  });

  it("builds a new engine after a reset", () => {
    const first = getSyncEngine();
    resetSyncEngine();

    expect(getSyncEngine()).not.toBe(first);
  });

  it("exposes the single-flight sync operation", () => {
    const engine = getSyncEngine();

    expect(typeof engine.sync).toBe("function");
    expect(jest.isMockFunction(engine.sync)).toBe(false);
  });
});
