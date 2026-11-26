import type {
  LocalConflictKind,
  OutboxMutation,
} from "@/shared/lib/local-db/local-db.types";

import type { RemoteWalletBalance } from "./sync.types";

export type ApplySuccessInput = {
  ownerId: string;
  mutation: OutboxMutation;
  revisionAfter: number;
  wallets: RemoteWalletBalance[];
  now: string;
};

export type ApplyConflictInput = {
  ownerId: string;
  mutation: OutboxMutation;
  kind: LocalConflictKind;
  errorCode: string;
  remoteSnapshot: Record<string, unknown>;
  now: string;
};

export type ApplyFailureInput = {
  ownerId: string;
  mutation: OutboxMutation;
  errorCode: string;
  attempts: number;
  /** ISO instant, or null when only a manual retry resumes it. */
  nextAttemptAt: string | null;
  now: string;
};

/**
 * Local side of one push outcome. Implemented per feature so the engine never
 * imports a feature mapper: the applier writes the record, the conflict and the
 * outbox row inside one local transaction.
 */
export interface SyncMutationApplier {
  applySuccess(input: ApplySuccessInput): Promise<void>;
  applyConflict(input: ApplyConflictInput): Promise<void>;
  applyFailure(input: ApplyFailureInput): Promise<void>;
}
