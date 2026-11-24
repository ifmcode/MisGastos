import { describe, expect, it } from "@jest/globals";

import {
  getBlockingOutboxMutation,
  selectNextOutboxMutation,
} from "../outbox.ordering";
import { buildMutation, NOW } from "./outbox.fixtures";

describe("selectNextOutboxMutation", () => {
  it("returns null for an empty queue", () => {
    expect(selectNextOutboxMutation([], NOW)).toBeNull();
  });

  it("returns the pending head", () => {
    const head = buildMutation({ seq: 1 });

    expect(selectNextOutboxMutation([head], NOW)).toBe(head);
  });

  it("returns the lowest seq regardless of array order", () => {
    const first = buildMutation({ seq: 1, clientMutationId: "a", entityId: "a" });
    const second = buildMutation({ seq: 2, clientMutationId: "b", entityId: "b" });

    expect(selectNextOutboxMutation([second, first], NOW)).toBe(first);
  });

  it.each(["syncing", "conflict"] as const)(
    "blocks while the head is %s",
    (status) => {
      const head = buildMutation({ seq: 1, status });

      expect(selectNextOutboxMutation([head], NOW)).toBeNull();
    },
  );

  it("blocks a failed head until its retry window opens", () => {
    const head = buildMutation({
      status: "failed",
      nextAttemptAt: "2026-11-20T10:10:00.000Z",
    });

    expect(selectNextOutboxMutation([head], NOW)).toBeNull();
    expect(selectNextOutboxMutation([head], "2026-11-20T10:10:00.000Z")).toBe(
      head,
    );
    expect(selectNextOutboxMutation([head], "2026-11-20T11:00:00.000Z")).toBe(
      head,
    );
  });

  it("never retries a permanent failure on its own", () => {
    const head = buildMutation({ status: "failed", nextAttemptAt: null });

    expect(selectNextOutboxMutation([head], NOW)).toBeNull();
    expect(selectNextOutboxMutation([head], "2030-01-01T00:00:00.000Z")).toBeNull();
  });

  it("blocks while a dependency is still queued", () => {
    const movement = buildMutation({
      seq: 1,
      clientMutationId: "tx-mutation",
      entityId: "tx-1",
      dependsOn: [{ entityType: "wallet", entityId: "w1" }],
    });
    const wallet = buildMutation({
      seq: 2,
      clientMutationId: "wallet-mutation",
      entityType: "wallet",
      entityId: "w1",
    });

    expect(selectNextOutboxMutation([movement, wallet], NOW)).toBeNull();
  });

  it("releases the mutation once the dependency was pushed", () => {
    const movement = buildMutation({
      seq: 2,
      dependsOn: [{ entityType: "wallet", entityId: "w1" }],
    });

    expect(selectNextOutboxMutation([movement], NOW)).toBe(movement);
  });
});

describe("getBlockingOutboxMutation", () => {
  it("returns null for an empty queue", () => {
    expect(getBlockingOutboxMutation([], NOW)).toBeNull();
  });

  it("returns null when the head can run", () => {
    expect(getBlockingOutboxMutation([buildMutation()], NOW)).toBeNull();
  });

  it("returns a failed head while its retry window is closed", () => {
    const head = buildMutation({
      status: "failed",
      nextAttemptAt: "2026-11-20T10:10:00.000Z",
    });

    expect(getBlockingOutboxMutation([head], NOW)).toBe(head);
  });

  it("returns the queued dependency when the head waits for it", () => {
    const movement = buildMutation({
      seq: 1,
      clientMutationId: "tx-mutation",
      entityId: "tx-1",
      dependsOn: [{ entityType: "wallet", entityId: "w1" }],
    });
    const wallet = buildMutation({
      seq: 2,
      clientMutationId: "wallet-mutation",
      entityType: "wallet",
      entityId: "w1",
    });

    expect(getBlockingOutboxMutation([wallet, movement], NOW)).toBe(wallet);
  });
});
