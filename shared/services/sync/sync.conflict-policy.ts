import type {
  LocalConflict,
  LocalConflictResolution,
  OutboxMutation,
  OutboxOperation,
} from "@/shared/lib/local-db/local-db.types";
import { readStoredRevision } from "@/shared/utils/revision";

import type { SyncConflictKind } from "./sync.types";

/** Revision the server currently holds for the conflicted record. */
export function readRemoteRevision(
  snapshot: Record<string, unknown>,
): number {
  return readStoredRevision(snapshot);
}

/**
 * Options the user can pick for one conflict. Only a real concurrent edit or a
 * remote delete can be re-applied safely; a wallet problem or a rejected
 * payload has to be edited, so the only explicit decision is to drop the local
 * change.
 */
export function getConflictResolutionOptions(
  kind: SyncConflictKind,
): readonly LocalConflictResolution[] {
  return kind === "REMOTE_CHANGED" || kind === "DELETED_REMOTELY"
    ? ["keep-mine", "keep-remote"]
    : ["keep-remote"];
}

export type RequeuedConflictResolution = {
  operation: OutboxOperation;
  baseRevision: number;
  serverSnapshot: Record<string, unknown>;
};

export type ConflictResolutionPlan =
  | {
      ok: true;
      /** Mutation payload to requeue, or null when nothing is sent again. */
      requeue: RequeuedConflictResolution | null;
      /** Overwrite the local record with the remote snapshot. */
      applyRemote: boolean;
      /** Remote document is gone: drop the local record. */
      removeLocal: boolean;
      /** Remote is already in the desired state: keep the local row as synced. */
      markLocalSynced: boolean;
    }
  | { ok: false; errorCode: string };

export type ConflictResolutionInput = {
  conflict: LocalConflict;
  mutation: OutboxMutation;
  choice: LocalConflictResolution;
};

function hasSnapshot(snapshot: Record<string, unknown>): boolean {
  return Object.keys(snapshot).length > 0;
}

/**
 * Pure decision for one user choice (ADR §7). The caller applies it inside one
 * local transaction and never discards data without a matching plan.
 */
export function planConflictResolution({
  conflict,
  mutation,
  choice,
}: ConflictResolutionInput): ConflictResolutionPlan {
  if (choice === "keep-remote") {
    const remote = hasSnapshot(conflict.remoteSnapshot);

    return {
      ok: true,
      requeue: null,
      applyRemote: remote,
      removeLocal: !remote,
      markLocalSynced: false,
    };
  }

  if (conflict.kind === "REMOTE_CHANGED") {
    if (!hasSnapshot(conflict.remoteSnapshot)) {
      return { ok: false, errorCode: "SYNC_CONFLICT_MISSING_REMOTE" };
    }

    return {
      ok: true,
      requeue: {
        operation: mutation.operation,
        baseRevision: readRemoteRevision(conflict.remoteSnapshot),
        serverSnapshot: conflict.remoteSnapshot,
      },
      applyRemote: false,
      removeLocal: false,
      markLocalSynced: false,
    };
  }

  if (conflict.kind === "DELETED_REMOTELY") {
    return {
      ok: true,
      // A delete is already in effect remotely; an edit is re-created with the
      // same client id, which is safe because the document no longer exists.
      requeue:
        mutation.operation === "delete"
          ? null
          : { operation: "create", baseRevision: 0, serverSnapshot: {} },
      applyRemote: false,
      removeLocal: false,
      markLocalSynced: mutation.operation === "delete",
    };
  }

  return { ok: false, errorCode: "SYNC_RESOLUTION_UNSUPPORTED" };
}
