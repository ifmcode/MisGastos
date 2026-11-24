import { describe, expect, it } from "@jest/globals";

import { LOCAL_DB_ERROR_CODES, LocalDbError } from "../local-db.errors";
import type { OutboxStatus } from "../local-db.types";
import {
  assertOutboxMutationCoalescible,
  assertOutboxTransition,
  canTransitionOutboxStatus,
  isPendingOutboxStatus,
} from "../outbox-state";
import { buildMutation } from "./outbox.fixtures";

const ALLOWED: ReadonlyArray<[OutboxStatus, OutboxStatus]> = [
  ["pending", "pending"],
  ["pending", "syncing"],
  ["pending", "failed"],
  ["pending", "conflict"],
  ["syncing", "pending"],
  ["syncing", "failed"],
  ["syncing", "conflict"],
  ["failed", "pending"],
  ["failed", "syncing"],
  ["failed", "conflict"],
  ["conflict", "pending"],
];

const INVALID: ReadonlyArray<[OutboxStatus, OutboxStatus]> = [
  ["syncing", "syncing"],
  ["failed", "failed"],
  ["conflict", "syncing"],
  ["conflict", "failed"],
  ["conflict", "conflict"],
];

describe("outbox state machine", () => {
  it.each(ALLOWED)("allows %s -> %s", (from, to) => {
    expect(canTransitionOutboxStatus(from, to)).toBe(true);
    expect(() => assertOutboxTransition(from, to)).not.toThrow();
  });

  it.each(INVALID)("rejects %s -> %s", (from, to) => {
    expect(canTransitionOutboxStatus(from, to)).toBe(false);
    expect(() => assertOutboxTransition(from, to)).toThrow(LocalDbError);
    expect(() => assertOutboxTransition(from, to)).toThrow(
      LOCAL_DB_ERROR_CODES.OUTBOX_INVALID_TRANSITION,
    );
  });

  it("treats pending and failed as pending work", () => {
    expect(isPendingOutboxStatus("pending")).toBe(true);
    expect(isPendingOutboxStatus("failed")).toBe(true);
    expect(isPendingOutboxStatus("syncing")).toBe(false);
    expect(isPendingOutboxStatus("conflict")).toBe(false);
  });
});

describe("assertOutboxMutationCoalescible", () => {
  it("accepts pending and failed rows", () => {
    expect(() =>
      assertOutboxMutationCoalescible(buildMutation({ status: "pending" })),
    ).not.toThrow();
    expect(() =>
      assertOutboxMutationCoalescible(buildMutation({ status: "failed" })),
    ).not.toThrow();
  });

  it("refuses to replace a mutation that is being pushed", () => {
    expect(() =>
      assertOutboxMutationCoalescible(buildMutation({ status: "syncing" })),
    ).toThrow(LOCAL_DB_ERROR_CODES.OUTBOX_MUTATION_IN_FLIGHT);
  });

  it("refuses to replace a mutation with an unresolved conflict", () => {
    expect(() =>
      assertOutboxMutationCoalescible(buildMutation({ status: "conflict" })),
    ).toThrow(LOCAL_DB_ERROR_CODES.OUTBOX_CONFLICT_UNRESOLVED);
  });
});
