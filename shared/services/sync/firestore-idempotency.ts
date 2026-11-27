import { doc, type Transaction as FirestoreTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { OutboxEntityType } from "@/shared/lib/local-db/local-db.types";
import { readStoredRevision } from "@/shared/utils/revision";

import { SyncMutationError } from "./sync.errors";

/** Inputs a queued mutation adds to an otherwise unchanged server operation. */
export type SyncMutationContext = {
  clientMutationId: string;
  baseRevision: number;
};

/**
 * Context of a queued **social** mutation. Social records belong to several
 * users, so the marker is scoped to the account that queued it (the outbox
 * owner), never to the record creator.
 */
export type SocialMutationContext = SyncMutationContext & {
  ownerId: string;
};

export type AppliedMutationInput = {
  ownerId: string;
  context: SyncMutationContext;
  entityType: OutboxEntityType;
  entityId: string;
  revisionAfter: number;
  now: string;
};

/** Deterministic marker id (ADR §5.2): no query and no extra index needed. */
export function appliedMutationId(
  ownerId: string,
  clientMutationId: string,
): string {
  return `${ownerId}__${clientMutationId}`;
}

export function appliedMutationRef(ownerId: string, clientMutationId: string) {
  return doc(db, "appliedMutations", appliedMutationId(ownerId, clientMutationId));
}

/**
 * Revision recorded by an already-applied mutation, or null when the marker does
 * not exist. Must be the first read of the server transaction so a replay (crash
 * after commit, lost ack) returns without touching money again.
 */
export async function readAppliedRevision(
  transaction: FirestoreTransaction,
  ownerId: string,
  context: SyncMutationContext,
): Promise<number | null> {
  const snapshot = await transaction.get(
    appliedMutationRef(ownerId, context.clientMutationId),
  );
  if (!snapshot.exists()) return null;

  const revision = (snapshot.data() as Record<string, unknown>).revisionAfter;

  return typeof revision === "number" && Number.isInteger(revision)
    ? revision
    : 0;
}

/** Optimistic concurrency: the remote revision must still be the local base. */
export function assertExpectedRevision(
  data: Record<string, unknown>,
  context: SyncMutationContext,
): void {
  if (readStoredRevision(data) !== context.baseRevision) {
    throw new SyncMutationError("REMOTE_CHANGED");
  }
}

/** Marker + data change commit atomically, which is what makes replay safe. */
export function writeAppliedMutation(
  transaction: FirestoreTransaction,
  input: AppliedMutationInput,
): void {
  transaction.set(
    appliedMutationRef(input.ownerId, input.context.clientMutationId),
    {
      ownerId: input.ownerId,
      clientMutationId: input.context.clientMutationId,
      entityType: input.entityType,
      entityId: input.entityId,
      revisionAfter: input.revisionAfter,
      appliedAt: input.now,
    },
  );
}
