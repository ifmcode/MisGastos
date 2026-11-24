import type { DatabasePort, LocalDatabaseTransaction } from "./database.port";
import { runInLocalTransaction } from "./local-transaction";
import type { OutboxMutation, OutboxMutationInput } from "./local-db.types";
import {
  buildOutboxMutation,
  coalesceOutboxMutation,
} from "./outbox.coalescing";
import { outboxMutationToRow } from "./outbox.mapper";
import {
  findOutboxMutationForEntity,
  listOutboxRowsByOwner,
  nextOutboxSeq,
  OUTBOX_TABLE,
  readOutboxMutation,
} from "./outbox.repository.helpers";
import {
  assertOutboxMutationCoalescible,
  assertOutboxTransition,
} from "./outbox-state";

/**
 * Inserts the first mutation of an entity or coalesces it with the queued one.
 * Replacing an in-flight or conflicted mutation is refused: the payload may
 * already exist server-side, or it is the evidence of an unresolved conflict.
 */
export async function enqueueOutboxMutation(
  port: DatabasePort,
  tx: LocalDatabaseTransaction | undefined,
  input: OutboxMutationInput,
): Promise<OutboxMutation> {
  return runInLocalTransaction(port, tx, async (active) => {
    const existing = await findOutboxMutationForEntity(
      active,
      input.ownerId,
      input.entityType,
      input.entityId,
    );

    if (!existing) {
      const seq = await nextOutboxSeq(active, input.ownerId);
      const mutation = buildOutboxMutation(input, seq);
      await active.upsert(OUTBOX_TABLE, outboxMutationToRow(mutation));
      return mutation;
    }

    assertOutboxMutationCoalescible(existing);
    const coalesced = coalesceOutboxMutation(existing, input);

    if (!coalesced) {
      await active.delete(OUTBOX_TABLE, {
        ownerId: existing.ownerId,
        clientMutationId: existing.clientMutationId,
      });
      return existing;
    }

    await active.upsert(OUTBOX_TABLE, outboxMutationToRow(coalesced));
    return coalesced;
  });
}

/** Reads the row, applies the change and persists it when the state allows it. */
export async function transitionOutboxMutation(
  port: DatabasePort,
  tx: LocalDatabaseTransaction | undefined,
  ownerId: string,
  clientMutationId: string,
  apply: (current: OutboxMutation) => OutboxMutation,
): Promise<OutboxMutation> {
  return runInLocalTransaction(port, tx, async (active) => {
    const current = await readOutboxMutation(active, ownerId, clientMutationId);
    const next = apply(current);

    assertOutboxTransition(current.status, next.status);
    await active.upsert(OUTBOX_TABLE, outboxMutationToRow(next));

    return next;
  });
}

export async function removeOutboxMutation(
  port: DatabasePort,
  tx: LocalDatabaseTransaction | undefined,
  ownerId: string,
  clientMutationId: string,
): Promise<void> {
  await runInLocalTransaction(port, tx, async (active) => {
    await readOutboxMutation(active, ownerId, clientMutationId);
    await active.delete(OUTBOX_TABLE, { ownerId, clientMutationId });
  });
}

/** Moves rows left `syncing` by a crash back to `pending` (state allows it). */
export async function reclaimInterruptedOutboxMutations(
  port: DatabasePort,
  tx: LocalDatabaseTransaction | undefined,
  ownerId: string,
  now: string,
): Promise<OutboxMutation[]> {
  return runInLocalTransaction(port, tx, async (active) => {
    const rows = await listOutboxRowsByOwner(active, ownerId);
    const interrupted = rows.filter((row) => row.status === "syncing");
    const requeued: OutboxMutation[] = [];

    for (const row of interrupted) {
      const next = await transitionOutboxMutation(
        port,
        active,
        ownerId,
        row.clientMutationId,
        (current) => ({ ...current, status: "pending", updatedAt: now }),
      );
      requeued.push(next);
    }

    return requeued;
  });
}
